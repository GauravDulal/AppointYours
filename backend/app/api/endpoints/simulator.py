from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.api import deps
from app.core.config import settings
from app.models.models import Conversation, Message, MessageSenderType, ConversationStatus
from app.ai.booking_agent import BookingAgent
from app.schemas.models import Message as MessageSchema
from sqlalchemy.sql import func

router = APIRouter()

class SimulatedMessage(BaseModel):
    channel: str  # instagram, facebook, whatsapp
    external_user_id: str
    content: str

@router.post("/inbound", response_model=MessageSchema)
async def simulate_inbound_message(
    *,
    db: Session = Depends(deps.get_db),
    msg_in: SimulatedMessage,
) -> Any:
    # Gate behind settings — disabled in production
    if not settings.SIMULATOR_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulator is disabled in this environment",
        )

    # 1. Find or create conversation
    conversation = db.query(Conversation).filter(
        Conversation.source_channel == msg_in.channel,
        Conversation.external_user_id == msg_in.external_user_id,
        Conversation.status != ConversationStatus.RESOLVED
    ).first()

    if not conversation:
        conversation = Conversation(
            source_channel=msg_in.channel,
            external_user_id=msg_in.external_user_id,
            status=ConversationStatus.ACTIVE
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 2. Store patient message
    message = Message(
        conversation_id=conversation.id,
        sender_type=MessageSenderType.PATIENT,
        content=msg_in.content
    )
    db.add(message)
    conversation.updated_at = func.now()
    db.commit()
    db.refresh(message)

    # 3. Trigger AI Agent
    agent = BookingAgent(db)
    await agent.process_message(conversation.id, msg_in.content)

    return message
