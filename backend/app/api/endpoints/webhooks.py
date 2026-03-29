"""
Meta (Instagram / Facebook / WhatsApp) webhook receiver.

Setup in Meta Developer Console:
  - Callback URL: https://your-backend.onrender.com/api/v1/webhooks/meta
  - Verify Token:  same value as META_VERIFY_TOKEN in .env
  - Subscribe to:  messages, messaging_postbacks
"""
import hashlib
import hmac
import logging
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.ai.booking_agent import BookingAgent
from app.models.models import Conversation, ConversationStatus, Message, MessageSenderType
from sqlalchemy.sql import func

router = APIRouter()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Webhook verification (GET) — Meta sends this to verify the endpoint
# ---------------------------------------------------------------------------
@router.get("")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    if not settings.META_VERIFY_TOKEN:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Webhook not configured")
    if hub_mode == "subscribe" and hub_verify_token == settings.META_VERIFY_TOKEN:
        logger.info("Meta webhook verified successfully")
        return int(hub_challenge)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed")


# ---------------------------------------------------------------------------
# Signature verification helper
# ---------------------------------------------------------------------------
def _verify_signature(raw_body: bytes, x_hub_signature: str | None) -> bool:
    if not settings.META_APP_SECRET:
        logger.warning("META_APP_SECRET not set — skipping signature verification")
        return True
    if not x_hub_signature:
        return False
    expected = "sha256=" + hmac.HMAC(
        settings.META_APP_SECRET.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, x_hub_signature)


# ---------------------------------------------------------------------------
# Incoming message handler (POST) — handles all three channels
# ---------------------------------------------------------------------------
@router.post("")
async def receive_webhook(
    request: Request,
    db: Session = Depends(deps.get_db),
    x_hub_signature_256: str | None = Header(None),
):
    raw_body = await request.body()
    if not _verify_signature(raw_body, x_hub_signature_256):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid signature")

    payload: dict[str, Any] = await request.json()
    obj = payload.get("object")
    logger.info("Meta webhook received: object=%s", obj)

    for entry in payload.get("entry", []):
        # -------------------------------------------------------------------
        # Facebook Messenger — uses "messaging" array
        # -------------------------------------------------------------------
        for messaging_event in entry.get("messaging", []):
            await _handle_facebook_event(messaging_event, db)

        # -------------------------------------------------------------------
        # Instagram + WhatsApp — use "changes" array
        # -------------------------------------------------------------------
        for change in entry.get("changes", []):
            field = change.get("field")
            value = change.get("value", {})

            if field == "messages" and obj == "instagram":
                # Instagram messages
                for msg in value.get("messages", []):
                    await _handle_instagram_message(msg, value, db)

            elif field == "messages" and obj == "whatsapp_business_account":
                # WhatsApp Cloud API messages
                await _handle_whatsapp_messages(value, db)

    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Channel-specific handlers
# ---------------------------------------------------------------------------

async def _handle_facebook_event(event: dict, db: Session) -> None:
    """Parse Facebook Messenger webhook event."""
    sender_id = event.get("sender", {}).get("id")
    message = event.get("message", {})
    text = message.get("text")
    if not sender_id or not text:
        return
    await _process_inbound(channel="facebook", external_user_id=sender_id, content=text, db=db)


async def _handle_instagram_message(msg: dict, value: dict, db: Session) -> None:
    """Parse Instagram webhook message."""
    sender_id = msg.get("from", {}).get("id") or value.get("sender", {}).get("id")
    text = (msg.get("text") or "").strip()
    if not sender_id or not text:
        return
    await _process_inbound(channel="instagram", external_user_id=sender_id, content=text, db=db)


async def _handle_whatsapp_messages(value: dict, db: Session) -> None:
    """Parse WhatsApp Cloud API webhook payload.

    WhatsApp sends:
    {
      "messaging_product": "whatsapp",
      "metadata": { "phone_number_id": "..." },
      "contacts": [...],
      "messages": [{
        "from": "15551234567",
        "type": "text",
        "text": { "body": "Hello" },
        "timestamp": "..."
      }]
    }
    """
    for msg in value.get("messages", []):
        msg_type = msg.get("type")
        sender_phone = msg.get("from")

        if not sender_phone:
            continue

        # Handle text messages
        if msg_type == "text":
            text = msg.get("text", {}).get("body", "").strip()
            if text:
                await _process_inbound(channel="whatsapp", external_user_id=sender_phone, content=text, db=db)

        # Handle interactive button replies
        elif msg_type == "interactive":
            interactive = msg.get("interactive", {})
            button_reply = interactive.get("button_reply", {})
            text = button_reply.get("title", "").strip()
            if text:
                await _process_inbound(channel="whatsapp", external_user_id=sender_phone, content=text, db=db)

        else:
            logger.info("Ignoring WhatsApp message type: %s from %s", msg_type, sender_phone)


# ---------------------------------------------------------------------------
# Shared inbound handler — find/create conversation, store message, trigger AI
# ---------------------------------------------------------------------------
async def _process_inbound(channel: str, external_user_id: str, content: str, db: Session) -> None:
    """Find-or-create conversation, store message, trigger AI agent."""
    conversation = db.query(Conversation).filter(
        Conversation.source_channel == channel,
        Conversation.external_user_id == external_user_id,
        Conversation.status != ConversationStatus.RESOLVED,
    ).first()

    if not conversation:
        conversation = Conversation(
            source_channel=channel,
            external_user_id=external_user_id,
            status=ConversationStatus.ACTIVE,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    message = Message(
        conversation_id=conversation.id,
        sender_type=MessageSenderType.PATIENT,
        content=content,
    )
    db.add(message)
    conversation.updated_at = func.now()
    db.commit()

    agent = BookingAgent(db)
    await agent.process_message(conversation.id, content)
    logger.info("Processed inbound [channel=%s user=%s conv=%s]", channel, external_user_id, conversation.id)
