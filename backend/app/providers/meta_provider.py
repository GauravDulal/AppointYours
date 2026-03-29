"""
Meta Graph API provider for Instagram and Facebook Messenger.

Sends messages back to users via the Meta Graph API.
Both Instagram and Facebook Messenger use the same endpoint.
"""
import logging
from typing import Optional

import httpx

from app.providers.base import MessageProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v21.0"


class MetaProvider(MessageProvider):
    """Send messages via Meta Graph API (Instagram DM + Facebook Messenger)."""

    def __init__(self, channel: str = "facebook"):
        self.channel = channel

    async def send_message(self, recipient_id: str, content: str) -> bool:
        """Send a text message to a user via the Meta Graph API.

        Args:
            recipient_id: The page-scoped or Instagram-scoped user ID.
            content: The text message to send.

        Returns:
            True if message was sent successfully, False otherwise.
        """
        if not settings.META_PAGE_ACCESS_TOKEN:
            logger.warning(
                "META_PAGE_ACCESS_TOKEN not set — cannot send %s message to %s",
                self.channel,
                recipient_id,
            )
            return False

        url = f"{GRAPH_API_BASE}/me/messages"
        payload = {
            "recipient": {"id": recipient_id},
            "message": {"text": content},
            "messaging_type": "RESPONSE",
        }
        params = {"access_token": settings.META_PAGE_ACCESS_TOKEN}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, json=payload, params=params)

            if response.status_code == 200:
                data = response.json()
                logger.info(
                    "Sent %s message to %s [message_id=%s]",
                    self.channel,
                    recipient_id,
                    data.get("message_id", "?"),
                )
                return True

            logger.error(
                "Meta API error [%s %s]: %s",
                response.status_code,
                self.channel,
                response.text,
            )
            return False

        except httpx.TimeoutException:
            logger.error("Meta API timeout sending %s message to %s", self.channel, recipient_id)
            return False
        except Exception as exc:
            logger.error("Meta API unexpected error: %s", exc)
            return False

    async def receive_message(self, data: dict) -> dict:
        """Parse is handled by the webhook endpoint — this is a no-op."""
        return data


class InstagramProvider(MetaProvider):
    def __init__(self):
        super().__init__("instagram")


class FacebookProvider(MetaProvider):
    def __init__(self):
        super().__init__("facebook")
