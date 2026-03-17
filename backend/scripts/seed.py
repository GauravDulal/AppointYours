import os
import sys
import datetime

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.db.session import SessionLocal, engine
from app.models.models import (
    Base, AdminUser, Service, AvailabilityRule, ClinicSettings,
    Patient, Conversation, Message, MessageSenderType, ConversationStatus,
    Appointment, AppointmentStatus
)
from app.core.security import get_password_hash

def seed_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(AdminUser).first():
            print("Database already seeded")
            return

        # 1. Admin User
        admin_user = AdminUser(
            full_name="Dr. Smith",
            email="admin@dentalflow.com",
            hashed_password=get_password_hash("password123"),
            is_active=True
        )
        db.add(admin_user)

        # 2. Clinic Settings
        clinic = ClinicSettings(
            clinic_name="Smile Bright Dental",
            clinic_email="notifications@smilebright.com",
            address="456 Dental Plaza, Health City",
            hours_note="Mon-Fri: 8AM - 6PM"
        )
        db.add(clinic)

        # 3. Services
        whitening = Service(name="Teeth Whitening", duration_minutes=60, price=200.0)
        cleaning = Service(name="Teeth Cleaning", duration_minutes=45, price=100.0)
        consultation = Service(name="Implant Consultation", duration_minutes=30, price=50.0)
        checkup = Service(name="General Checkup", duration_minutes=30, price=80.0)
        db.add_all([whitening, cleaning, consultation, checkup])
        db.flush()

        # 4. Availability Rules (Mon-Fri)
        for i in range(5):
            rule = AvailabilityRule(
                weekday=i,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(17, 0)
            )
            db.add(rule)

        # 5. Patients
        p1 = Patient(full_name="Ram Sharma", phone="9841234567")
        p2 = Patient(full_name="Sita Gupta", phone="9851234567")
        db.add_all([p1, p2])
        db.flush()

        # 6. Conversations
        c1 = Conversation(
            source_channel="instagram",
            external_user_id="inst_user_1",
            status=ConversationStatus.ACTIVE,
            detected_intent="book_appointment"
        )
        db.add(c1)
        db.flush()

        m1 = Message(
            conversation_id=c1.id,
            sender_type=MessageSenderType.PATIENT,
            content="Hi, I saw your whitening post. I want to book."
        )
        m2 = Message(
            conversation_id=c1.id,
            sender_type=MessageSenderType.ASSISTANT,
            content="Sure! I can help you book an appointment. Would you like a whitening session or a consultation first?"
        )
        db.add_all([m1, m2])

        # Urgent Conversation
        c2 = Conversation(
            source_channel="whatsapp",
            external_user_id="wa_user_1",
            status=ConversationStatus.ACTIVE,
            urgency_flag=True,
            detected_intent="urgent_dental_issue"
        )
        db.add(c2)
        db.flush()
        
        m3 = Message(
            conversation_id=c2.id,
            sender_type=MessageSenderType.PATIENT,
            content="My tooth is bleeding and it hurts a lot!"
        )
        db.add(m3)

        # 7. Appointments
        a1 = Appointment(
            patient_id=p1.id,
            service_id=whitening.id,
            start_at=datetime.datetime.now() + datetime.timedelta(days=2, hours=10),
            end_at=datetime.datetime.now() + datetime.timedelta(days=2, hours=11),
            status=AppointmentStatus.BOOKED,
            source_channel="facebook",
            booked_by_ai=True
        )
        db.add(a1)

        db.commit()
        print("Database seeded successfully")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
