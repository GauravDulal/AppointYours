"""Background scheduler — appointment reminders & urgent conversation alerts."""
import datetime
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.models import (
    Appointment, AppointmentStatus, ClinicSettings,
    Conversation, NotificationLog,
)
from app.core.config import settings

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


# ---------------------------------------------------------------------------
# Email helper
# ---------------------------------------------------------------------------
def _send_email(to: str, subject: str, body: str) -> bool:
    """Send email via SMTP. Returns True on success, False on failure."""
    if not all([settings.SMTP_SERVER, settings.SMTP_PORT, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        logger.warning("SMTP not configured — skipping email to %s: %s", to, subject)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_USER
        msg["To"] = to
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to, msg.as_string())
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)
        return False


# ---------------------------------------------------------------------------
# Job 1 — Appointment reminders (runs every 30 min)
# ---------------------------------------------------------------------------
def check_reminders() -> None:
    db: Session = SessionLocal()
    try:
        now = datetime.datetime.now(datetime.timezone.utc)
        clinic = db.query(ClinicSettings).first()
        lead_hours = clinic.reminder_lead_time_hours if clinic else 24
        reminder_window = now + datetime.timedelta(hours=lead_hours)

        upcoming = db.query(Appointment).filter(
            Appointment.start_at > now,
            Appointment.start_at <= reminder_window,
            Appointment.status.in_([AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED]),
        ).all()

        for appt in upcoming:
            already_sent = db.query(NotificationLog).filter(
                NotificationLog.related_appointment_id == appt.id,
                NotificationLog.notification_type == "reminder",
                NotificationLog.status == "sent",
            ).first()
            if already_sent:
                continue

            recipient = clinic.clinic_email if clinic else settings.CLINIC_EMAIL
            patient_name = appt.patient.full_name if appt.patient else "Patient"
            service_name = appt.service.name if appt.service else "Appointment"
            start_str = appt.start_at.strftime("%A %d %b %Y at %I:%M %p")

            body = (
                f"Reminder: {patient_name} has a {service_name} appointment {start_str}.\n"
                f"Channel: {appt.source_channel or 'unknown'}\n"
            )
            success = _send_email(recipient, f"Appointment Reminder — {patient_name}", body)

            log = NotificationLog(
                notification_type="reminder",
                recipient=recipient,
                status="sent" if success else "failed",
                related_appointment_id=appt.id,
                content_summary=f"Reminder for {service_name} with {patient_name}",
            )
            db.add(log)

        db.commit()
        logger.info("Reminders job complete — checked %d upcoming appointments", len(upcoming))
    except Exception as exc:
        logger.error("Reminders job error: %s", exc)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Job 2 — Urgent conversation alerts (runs every 5 min)
# ---------------------------------------------------------------------------
def check_urgent_alerts() -> None:
    db: Session = SessionLocal()
    try:
        clinic = db.query(ClinicSettings).first()
        recipient = clinic.clinic_email if clinic else settings.CLINIC_EMAIL

        unnotified_urgent = (
            db.query(Conversation)
            .filter(
                Conversation.urgency_flag == True,
            )
            .outerjoin(
                NotificationLog,
                (NotificationLog.notification_type == "urgent_alert") &
                (NotificationLog.recipient == Conversation.external_user_id),
            )
            .filter(NotificationLog.id == None)
            .all()
        )

        for conv in unnotified_urgent:
            body = (
                f"URGENT: A conversation from {conv.source_channel} "
                f"(user: {conv.external_user_id}) was flagged as urgent.\n"
                f"Intent: {conv.detected_intent or 'unknown'}\n"
                f"Please review immediately in the dashboard.\n"
            )
            success = _send_email(recipient, "⚠️ Urgent Patient Alert", body)

            log = NotificationLog(
                notification_type="urgent_alert",
                recipient=conv.external_user_id,
                status="sent" if success else "failed",
                content_summary=f"Urgent alert for conversation {conv.id}",
            )
            db.add(log)

        db.commit()
        if unnotified_urgent:
            logger.warning("Urgent alerts sent for %d conversations", len(unnotified_urgent))
    except Exception as exc:
        logger.error("Urgent alerts job error: %s", exc)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Scheduler bootstrap
# ---------------------------------------------------------------------------
def start_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        return
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(check_reminders, "interval", minutes=30, id="reminders")
    _scheduler.add_job(check_urgent_alerts, "interval", minutes=5, id="urgent_alerts")
    _scheduler.start()
    logger.info("Scheduler started (reminders every 30 min, urgent alerts every 5 min)")

