from typing import Any, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.models import Conversation, Message, AdminUser, ConversationStatus
from app.schemas.models import (
    Conversation as ConversationSchema,
    Message as MessageSchema,
    MessageCreate,
    ConversationSummaryStats,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Conversation summary stats for dashboard
# ---------------------------------------------------------------------------
@router.get("/summary", response_model=ConversationSummaryStats)
def get_conversation_summary(
    db: Session = Depends(deps.get_db),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    active = db.query(Conversation).filter(Conversation.status == ConversationStatus.ACTIVE).count()
    urgent = db.query(Conversation).filter(Conversation.urgency_flag == True).count()
    resolved = db.query(Conversation).filter(Conversation.status == ConversationStatus.RESOLVED).count()
    follow_up = db.query(Conversation).filter(Conversation.status == ConversationStatus.FOLLOW_UP).count()
    return ConversationSummaryStats(
        total_active=active,
        total_urgent=urgent,
        total_resolved=resolved,
        total_follow_up=follow_up,
    )


# ---------------------------------------------------------------------------
# Recent conversations for dashboard
# ---------------------------------------------------------------------------
@router.get("/recent", response_model=List[ConversationSchema])
def read_recent_conversations(
    db: Session = Depends(deps.get_db),
    limit: int = Query(5, le=20),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    conversations = (
        db.query(Conversation)
        .filter(Conversation.status != ConversationStatus.RESOLVED)
        .order_by(Conversation.updated_at.desc().nullslast(), Conversation.created_at.desc())
        .limit(limit)
        .all()
    )
    return conversations


# ---------------------------------------------------------------------------
# List all conversations (with optional filters)
# ---------------------------------------------------------------------------
@router.get("/", response_model=List[ConversationSchema])
def read_conversations(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0),
    limit: int = Query(100),
    status: ConversationStatus | None = Query(None),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    query = db.query(Conversation)
    if status:
        query = query.filter(Conversation.status == status)
    conversations = query.order_by(Conversation.updated_at.desc().nullslast()).offset(skip).limit(limit).all()
    return conversations


# ---------------------------------------------------------------------------
# Get urgent conversations (MUST come before /{id})
# ---------------------------------------------------------------------------
@router.get("/urgent", response_model=List[ConversationSchema])
def read_urgent_conversations(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0),
    limit: int = Query(100),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    urgent = (
        db.query(Conversation)
        .filter(Conversation.urgency_flag == True)
        .order_by(Conversation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return urgent


# ---------------------------------------------------------------------------
# Get single conversation by ID
# ---------------------------------------------------------------------------
@router.get("/{id}", response_model=ConversationSchema)
def read_conversation(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    conversation = db.query(Conversation).filter(Conversation.id == id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


# ---------------------------------------------------------------------------
# Add message to conversation (staff reply to conversation)
# ---------------------------------------------------------------------------
@router.post("/{id}/messages", response_model=MessageSchema)
def create_message(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    message_in: MessageCreate,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    conversation = db.query(Conversation).filter(Conversation.id == id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    message = Message(
        conversation_id=id,
        sender_type=message_in.sender_type,
        content=message_in.content,
    )
    db.add(message)
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)
    return message


# ---------------------------------------------------------------------------
# Get all messages for a conversation
# ---------------------------------------------------------------------------
@router.get("/{id}/messages", response_model=List[MessageSchema])
def read_conversation_messages(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    skip: int = Query(0),
    limit: int = Query(1000),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    conversation = db.query(Conversation).filter(Conversation.id == id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == id)
        .order_by(Message.timestamp.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return messages


# ---------------------------------------------------------------------------
# Update conversation status
# ---------------------------------------------------------------------------
@router.patch("/{id}/status", response_model=ConversationSchema)
def update_conversation_status(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    status: ConversationStatus,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    conversation = db.query(Conversation).filter(Conversation.id == id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.status = status
    db.commit()
    db.refresh(conversation)
    return conversation
