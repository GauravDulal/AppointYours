"""
WhatsApp Cloud API provider.

Sends text messages back to patients via the WhatsApp Business Cloud API.
"""
import logging

import httpx

from app.providers.base import MessageProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v21.0"


class WhatsAppProvider(MessageProvider):
    """Send messages via WhatsApp Cloud API."""

    async def send_message(self, recipient_id: str, content: str) -> bool:
        """Send a text message to a WhatsApp user.

        Args:
            recipient_id: The user's phone number in international format (e.g. "15551234567").
            content: The text message to send.

        Returns:
            True if the message was sent, False otherwise.

        Note:
            Text messages can only be sent within a 24-hour window after the user's last message.
            Outside that window, you must use an approved message template.
        """
        if not settings.WHATSAPP_PHONE_NUMBER_ID or not settings.WHATSAPP_ACCESS_TOKEN:
            logger.warning(
                "WhatsApp credentials not set — cannot send message to %s",
                recipient_id,
            )
            return False

        url = f"{GRAPH_API_BASE}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": recipient_id,
            "type": "text",
            "text": {"preview_url": False, "body": content},
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, json=payload, headers=headers)

            if response.status_code == 200:
                data = response.json()
                msg_id = data.get("messages", [{}])[0].get("id", "?")
                logger.info("Sent WhatsApp message to %s [wamid=%s]", recipient_id, msg_id)
                return True

            logger.error(
                "WhatsApp API error [%s]: %s",
                response.status_code,
                response.text,
            )
            return False

        except httpx.TimeoutException:
            logger.error("WhatsApp API timeout sending to %s", recipient_id)
            return False
        except Exception as exc:
            logger.error("WhatsApp API unexpected error: %s", exc)
            return False

    async def receive_message(self, data: dict) -> dict:
        """Parse is handled by the webhook endpoint — this is a no-op."""
        return data
