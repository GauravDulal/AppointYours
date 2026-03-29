"""
AI Booking Agent — Handles inbound patient messages, generates replies using
Google Gemini (free) or OpenAI (paid fallback), and sends them back via the
appropriate social media provider.
"""
from sqlalchemy.orm import Session
from app.models.models import (
    Conversation, Message, MessageSenderType,
    Patient, Service, Appointment, AppointmentStatus,
    AvailabilityRule, BlockedDate, ConversationStatus
)
from app.core.config import settings
import datetime
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# System prompt that instructs the AI how to behave as a dental booking assistant
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are an AI booking assistant for a dental clinic.
Your job is to help patients book appointments via social media messages.

Guidelines:
- Be friendly, concise, and professional.
- ALWAYS collect: preferred service, preferred date/time, patient full name, phone number.
- If the message indicates URGENT symptoms (pain, bleeding, swelling, broken tooth, accident),
  respond with empathy, flag it as urgent, and instruct them to call the clinic immediately.
- When you have enough information to book, confirm all details and say you are completing the booking.
- Keep responses short (2-4 sentences max) suitable for chat messaging.
- Do NOT make up clinic phone numbers or addresses. Say "please contact the clinic directly" if needed.

Available services: {services}
Available slots (next 5 days): {slots}

Conversation history is provided. Respond only with the assistant reply text, no JSON, no labels.
"""

URGENT_KEYWORDS = ["pain", "bleeding", "swelling", "emergency", "broken tooth", "accident", "abscess", "severe"]


class BookingAgent:
    def __init__(self, db: Session):
        self.db = db

    async def process_message(self, conversation_id: int, content: str) -> str:
        conversation = self.db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            return "Error: Conversation not found"

        # Check urgency early (fast-path, no LLM needed)
        is_urgent = any(kw in content.lower() for kw in URGENT_KEYWORDS)
        if is_urgent:
            conversation.urgency_flag = True
            conversation.detected_intent = "urgent_dental_issue"
            self.db.commit()

        # Build context
        services = self.db.query(Service).filter(Service.is_active == True).all()
        service_list = ", ".join(s.name for s in services) if services else "General Dentistry"
        slots = self._get_available_slots()

        # Fetch conversation history (last 10 messages for context window)
        history = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.timestamp.desc())
            .limit(10)
            .all()
        )
        history_reversed = list(reversed(history))

        # Generate AI response
        response = await self._call_ai(content, history_reversed, service_list, slots)

        # Detect intent from response keywords
        response_lower = response.lower()
        if is_urgent:
            pass  # already set
        elif any(w in response_lower for w in ["confirmed", "booked", "confirmation"]):
            conversation.detected_intent = "booking_confirmed"
            conversation.status = ConversationStatus.RESOLVED
        elif any(w in response_lower for w in ["which service", "what service", "looking for"]):
            conversation.detected_intent = "service_inquiry"
        elif any(w in response_lower for w in ["full name", "phone number", "contact"]):
            conversation.detected_intent = "info_collection"
        elif any(w in response_lower for w in ["slot", "available", "monday", "tuesday", "wednesday", "thursday", "friday"]):
            conversation.detected_intent = "slot_selection"
        else:
            conversation.detected_intent = "general_inquiry"

        # Persist assistant reply
        assistant_msg = Message(
            conversation_id=conversation_id,
            sender_type=MessageSenderType.ASSISTANT,
            content=response,
        )
        self.db.add(assistant_msg)
        self.db.commit()

        # ---------------------------------------------------------------
        # SEND REPLY BACK TO PATIENT via the appropriate social provider
        # ---------------------------------------------------------------
        await self._send_reply(conversation, response)

        return response

    async def _send_reply(self, conversation: Conversation, text: str) -> None:
        """Send the AI reply back to the patient through their social media channel."""
        channel = conversation.source_channel
        recipient = conversation.external_user_id

        try:
            if channel in ("instagram", "facebook"):
                from app.providers.meta_provider import MetaProvider
                provider = MetaProvider(channel)
                sent = await provider.send_message(recipient, text)
            elif channel == "whatsapp":
                from app.providers.whatsapp_provider import WhatsAppProvider
                provider = WhatsAppProvider()
                sent = await provider.send_message(recipient, text)
            else:
                # Simulator or unknown channel — don't send externally
                logger.info("No external provider for channel '%s' — reply stored in DB only", channel)
                return

            if sent:
                logger.info("Reply delivered via %s to %s", channel, recipient)
            else:
                logger.warning("Failed to deliver reply via %s to %s — stored in DB for manual follow-up", channel, recipient)

        except Exception as exc:
            logger.error("Provider error [%s → %s]: %s", channel, recipient, exc)

    async def _call_ai(
        self, latest_message: str, history: list, service_list: str, slots: list
    ) -> str:
        """Call Gemini (free) or OpenAI (paid fallback). Falls back to rules if neither is set."""

        # Priority 1: Google Gemini (free)
        if settings.GEMINI_API_KEY:
            return await self._call_gemini(latest_message, history, service_list, slots)

        # Priority 2: OpenAI (paid)
        if settings.OPENAI_API_KEY:
            return await self._call_openai(latest_message, history, service_list, slots)

        # Priority 3: Rule-based fallback (no API key needed)
        logger.warning("No AI API key set — using rule-based fallback")
        return self._rule_based_fallback(latest_message, service_list, slots)

    async def _call_gemini(
        self, latest_message: str, history: list, service_list: str, slots: list
    ) -> str:
        """Call Google Gemini API (free tier: 15 RPM, 1500 RPD)."""
        try:
            from google import genai

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            slot_strings = [s.strftime("%A %d %b, %I:%M %p") for s in slots[:6]]
            system = SYSTEM_PROMPT.format(
                services=service_list,
                slots=", ".join(slot_strings),
            )

            # Build conversation contents
            contents = []
            for msg in history:
                role = "user" if msg.sender_type == MessageSenderType.PATIENT else "model"
                contents.append({"role": role, "parts": [{"text": msg.content}]})

            # Append latest if not already at end
            if not history or history[-1].content != latest_message:
                contents.append({"role": "user", "parts": [{"text": latest_message}]})

            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=contents,
                config={
                    "system_instruction": system,
                    "max_output_tokens": 256,
                    "temperature": 0.4,
                },
            )
            return response.text.strip()

        except Exception as exc:
            logger.error("Gemini call failed: %s", exc)
            # Try OpenAI as fallback
            if settings.OPENAI_API_KEY:
                return await self._call_openai(latest_message, history, service_list, slots)
            return self._rule_based_fallback(latest_message, service_list, slots)

    async def _call_openai(
        self, latest_message: str, history: list, service_list: str, slots: list
    ) -> str:
        """Call OpenAI ChatCompletion (paid fallback)."""
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

            slot_strings = [s.strftime("%A %d %b, %I:%M %p") for s in slots[:6]]
            system = SYSTEM_PROMPT.format(
                services=service_list,
                slots=", ".join(slot_strings),
            )

            messages = [{"role": "system", "content": system}]
            for msg in history:
                role = "user" if msg.sender_type == MessageSenderType.PATIENT else "assistant"
                messages.append({"role": role, "content": msg.content})
            if not history or history[-1].content != latest_message:
                messages.append({"role": "user", "content": latest_message})

            completion = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=256,
                temperature=0.4,
            )
            return completion.choices[0].message.content.strip()

        except Exception as exc:
            logger.error("OpenAI call failed: %s", exc)
            return self._rule_based_fallback(latest_message, service_list, slots)

    def _rule_based_fallback(self, content: str, service_list: str, slots: list) -> str:
        """Deterministic fallback used when no AI API is available."""
        content_lower = content.lower()
        if any(kw in content_lower for kw in URGENT_KEYWORDS):
            return (
                "I'm sorry to hear you're in pain. Please call our clinic immediately — "
                "our team is standing by to help you with urgent dental care."
            )
        if any(w in content_lower for w in ["book", "appointment", "schedule", "see a dentist"]):
            return (
                f"I'd be happy to help you book an appointment! We offer: {service_list}. "
                "Which service are you looking for?"
            )
        slot_str = slots[0].strftime("%A %d %b at %I:%M %p") if slots else "Monday 10:00 AM"
        if any(w in content_lower for w in ["clean", "check", "whitening", "filling", "extraction", "root"]):
            return (
                f"Great choice! The next available slot is {slot_str}. "
                "Does that work for you? If so, please share your full name and phone number."
            )
        if any(day in content_lower for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]):
            return "Perfect. Could you please share your full name and phone number to confirm the booking?"
        if any(c.isdigit() for c in content_lower) and len(content_lower) > 6:
            return (
                "Thank you! Your appointment has been noted. "
                "You'll receive a confirmation shortly — we look forward to seeing you!"
            )
        return "I'm here to help you book a dental appointment. Would you like to schedule one, or do you have a question about our services?"

    def _get_available_slots(self) -> list:
        """Return next available 10 slots based on AvailabilityRules, excluding BlockedDates."""
        slots: list = []
        now = datetime.datetime.now()
        rules = self.db.query(AvailabilityRule).filter(AvailabilityRule.is_active == True).all()
        blocked = {
            b.date for b in self.db.query(BlockedDate).all()
        }

        if not rules:
            # Default fallback: Mon-Fri 10 AM and 2 PM
            for i in range(1, 8):
                day = now + datetime.timedelta(days=i)
                if day.weekday() < 5 and day.date() not in blocked:
                    slots.append(day.replace(hour=10, minute=0, second=0, microsecond=0))
                    slots.append(day.replace(hour=14, minute=0, second=0, microsecond=0))
            return slots[:10]

        for i in range(1, 14):
            day = now + datetime.timedelta(days=i)
            if day.date() in blocked:
                continue
            for rule in rules:
                if rule.weekday == day.weekday():
                    slot_dt = day.replace(
                        hour=rule.start_time.hour,
                        minute=rule.start_time.minute,
                        second=0,
                        microsecond=0,
                    )
                    slots.append(slot_dt)
            if len(slots) >= 10:
                break

        return slots
