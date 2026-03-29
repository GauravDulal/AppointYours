from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime, time, date
from app.models.models import AppointmentStatus, ConversationStatus, MessageSenderType

# User
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Patient
class PatientBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    notes: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Service
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: Optional[float] = None
    is_active: Optional[bool] = True

class ServiceCreate(ServiceBase):
    pass

class Service(ServiceBase):
    id: int

    class Config:
        from_attributes = True

# Availability
class AvailabilityRuleBase(BaseModel):
    weekday: int
    start_time: time
    end_time: time
    is_active: Optional[bool] = True

class AvailabilityRuleCreate(AvailabilityRuleBase):
    pass

class AvailabilityRule(AvailabilityRuleBase):
    id: int

    class Config:
        from_attributes = True

class BlockedDateBase(BaseModel):
    date: date
    reason: Optional[str] = None

class BlockedDateCreate(BlockedDateBase):
    pass

class BlockedDate(BlockedDateBase):
    id: int

    class Config:
        from_attributes = True

# Appointment
class AppointmentBase(BaseModel):
    patient_id: int
    service_id: int
    start_at: datetime
    end_at: datetime
    status: AppointmentStatus
    source_channel: str
    booked_by_ai: bool = True
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AppointmentEnriched(BaseModel):
    """Appointment response with resolved patient/service names."""
    id: int
    patient_id: int
    patient_name: str
    service_id: int
    service_name: str
    start_at: datetime
    end_at: datetime
    status: AppointmentStatus
    source_channel: str
    booked_by_ai: bool
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AppointmentSummary(BaseModel):
    """Appointment statistics summary."""
    total: int
    booked: int
    completed: int
    cancelled: int
    completion_rate_pct: float
    cancellation_rate_pct: float

# Conversation
class MessageBase(BaseModel):
    sender_type: MessageSenderType
    content: str
    external_message_id: Optional[str] = None

class MessageCreate(MessageBase):
    conversation_id: int

class Message(MessageBase):
    id: int
    conversation_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    source_channel: str
    external_user_id: str
    status: ConversationStatus
    detected_intent: Optional[str] = None
    urgency_flag: bool = False
    ai_summary: Optional[str] = None
    patient_id: Optional[int] = None
    appointment_id: Optional[int] = None

class ConversationCreate(ConversationBase):
    pass

class Conversation(ConversationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    messages: List[Message] = []

    class Config:
        from_attributes = True

class ConversationSummaryStats(BaseModel):
    """Conversation statistics for the dashboard."""
    total_active: int
    total_urgent: int
    total_resolved: int
    total_follow_up: int

# Clinic Settings
class ClinicSettingsBase(BaseModel):
    clinic_name: str
    clinic_email: EmailStr
    address: Optional[str] = None
    hours_note: Optional[str] = None
    reminder_lead_time_hours: int = 24
    timezone: str = "UTC"

class ClinicSettingsCreate(ClinicSettingsBase):
    pass

class ClinicSettings(ClinicSettingsBase):
    id: int

    class Config:
        from_attributes = True
