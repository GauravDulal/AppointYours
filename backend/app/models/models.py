from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum, Text, Float, Time, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base_class import Base

class AdminUser(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)

class Patient(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    phone = Column(String, index=True)
    email = Column(String, index=True, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    appointments = relationship("Appointment", back_populates="patient")

class Service(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30)
    price = Column(Float, nullable=True)
    is_active = Column(Boolean(), default=True)
    
    appointments = relationship("Appointment", back_populates="service")

class AvailabilityRule(Base):
    id = Column(Integer, primary_key=True, index=True)
    weekday = Column(Integer)  # 0-6 (Monday-Sunday)
    start_time = Column(Time)
    end_time = Column(Time)
    is_active = Column(Boolean(), default=True)

class BlockedDate(Base):
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    reason = Column(String, nullable=True)

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    BOOKED = "booked"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    COMPLETED = "completed"

class Appointment(Base):
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient.id"))
    service_id = Column(Integer, ForeignKey("service.id"))
    start_at = Column(DateTime(timezone=True))
    end_at = Column(DateTime(timezone=True))
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.BOOKED)
    source_channel = Column(String) # instagram, facebook, whatsapp
    booked_by_ai = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    patient = relationship("Patient", back_populates="appointments")
    service = relationship("Service", back_populates="appointments")

class MessageSenderType(str, enum.Enum):
    PATIENT = "patient"
    ASSISTANT = "assistant"
    STAFF = "staff"
    SYSTEM = "system"

class ConversationStatus(str, enum.Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    FOLLOW_UP = "follow_up"

class Conversation(Base):
    id = Column(Integer, primary_key=True, index=True)
    source_channel = Column(String)
    external_user_id = Column(String, index=True)
    status = Column(Enum(ConversationStatus), default=ConversationStatus.ACTIVE)
    detected_intent = Column(String, nullable=True)
    urgency_flag = Column(Boolean, default=False)
    ai_summary = Column(Text, nullable=True)
    patient_id = Column(Integer, ForeignKey("patient.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointment.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversation.id"))
    sender_type = Column(Enum(MessageSenderType))
    content = Column(Text)
    external_message_id = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")

class ClinicSettings(Base):
    id = Column(Integer, primary_key=True, index=True)
    clinic_name = Column(String)
    clinic_email = Column(String)
    address = Column(Text, nullable=True)
    hours_note = Column(Text, nullable=True)
    reminder_lead_time_hours = Column(Integer, default=24)
    timezone = Column(String, default="UTC")

class NotificationLog(Base):
    id = Column(Integer, primary_key=True, index=True)
    notification_type = Column(String) # booking_confirmation, reminder, urgent_alert
    recipient = Column(String)
    status = Column(String) # sent, failed, pending
    related_appointment_id = Column(Integer, ForeignKey("appointment.id"), nullable=True)
    content_summary = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
