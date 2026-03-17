"""
Meta (Instagram / Facebook / WhatsApp) webhook receiver.

Setup in Meta Developer Console:
  - Callback URL: https://yourdomain.com/api/v1/webhooks/meta
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
    expected = "sha256=" + hmac.new(
        settings.META_APP_SECRET.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, x_hub_signature)


# ---------------------------------------------------------------------------
# Incoming message handler (POST)
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
    logger.info("Meta webhook received: object=%s", payload.get("object"))

    for entry in payload.get("entry", []):
        for messaging_event in entry.get("messaging", []):
            await _handle_messaging_event(messaging_event, "facebook", db)
        # Instagram uses "changes" structure
        for change in entry.get("changes", []):
            if change.get("field") == "messages":
                value = change.get("value", {})
                for msg in value.get("messages", []):
                    await _handle_instagram_message(msg, value, db)

    return {"status": "ok"}


async def _handle_messaging_event(event: dict, channel: str, db: Session) -> None:
    sender_id = event.get("sender", {}).get("id")
    message = event.get("message", {})
    text = message.get("text")
    if not sender_id or not text:
        return
    await _process_inbound(channel=channel, external_user_id=sender_id, content=text, db=db)


async def _handle_instagram_message(msg: dict, value: dict, db: Session) -> None:
    sender_id = msg.get("from", {}).get("id") or value.get("sender", {}).get("id")
    text = (msg.get("text") or "").strip()
    if not sender_id or not text:
        return
    await _process_inbound(channel="instagram", external_user_id=sender_id, content=text, db=db)


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
