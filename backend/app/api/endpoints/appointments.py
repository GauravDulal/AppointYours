from typing import Any, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.api import deps
from app.models.models import Appointment, AdminUser, AppointmentStatus, Patient, Service
from app.schemas.models import (
    Appointment as AppointmentSchema,
    AppointmentCreate,
    AppointmentEnriched,
    AppointmentSummary,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Get summary stats (MUST come before /{id})
# ---------------------------------------------------------------------------
@router.get("/summary", response_model=AppointmentSummary)
def get_appointment_summary(
    db: Session = Depends(deps.get_db),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    total = db.query(Appointment).count()
    booked = db.query(Appointment).filter(Appointment.status == AppointmentStatus.BOOKED).count()
    completed = db.query(Appointment).filter(Appointment.status == AppointmentStatus.COMPLETED).count()
    cancelled = db.query(Appointment).filter(Appointment.status == AppointmentStatus.CANCELLED).count()

    completed_pct = (completed / total * 100) if total > 0 else 0
    cancelled_pct = (cancelled / total * 100) if total > 0 else 0

    return AppointmentSummary(
        total=total,
        booked=booked,
        completed=completed,
        cancelled=cancelled,
        completion_rate_pct=round(completed_pct, 1),
        cancellation_rate_pct=round(cancelled_pct, 1),
    )


# ---------------------------------------------------------------------------
# Get upcoming appointments for dashboard
# ---------------------------------------------------------------------------
@router.get("/upcoming", response_model=List[AppointmentEnriched])
def get_upcoming_appointments(
    db: Session = Depends(deps.get_db),
    limit: int = Query(5, le=20),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    now = datetime.now(timezone.utc)
    appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.patient), joinedload(Appointment.service))
        .filter(
            Appointment.start_at > now,
            Appointment.status.in_([AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED]),
        )
        .order_by(Appointment.start_at.asc())
        .limit(limit)
        .all()
    )
    return [_enrich_appointment(a) for a in appointments]


# ---------------------------------------------------------------------------
# List appointments with filters (enriched with names)
# ---------------------------------------------------------------------------
@router.get("/", response_model=List[AppointmentEnriched])
def read_appointments(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0),
    limit: int = Query(100),
    status: AppointmentStatus | None = Query(None),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    query = db.query(Appointment).options(
        joinedload(Appointment.patient), joinedload(Appointment.service)
    )
    if status:
        query = query.filter(Appointment.status == status)
    appointments = query.order_by(Appointment.start_at.desc()).offset(skip).limit(limit).all()
    return [_enrich_appointment(a) for a in appointments]


# ---------------------------------------------------------------------------
# Create appointment
# ---------------------------------------------------------------------------
@router.post("/", response_model=AppointmentEnriched)
def create_appointment(
    *,
    db: Session = Depends(deps.get_db),
    appointment_in: AppointmentCreate,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    appointment = Appointment(**appointment_in.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    # Eager load relationships after create
    db.refresh(appointment, attribute_names=["patient", "service"])
    return _enrich_appointment(appointment)


# ---------------------------------------------------------------------------
# Get single appointment
# ---------------------------------------------------------------------------
@router.get("/{id}", response_model=AppointmentEnriched)
def read_appointment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    appointment = (
        db.query(Appointment)
        .options(joinedload(Appointment.patient), joinedload(Appointment.service))
        .filter(Appointment.id == id)
        .first()
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return _enrich_appointment(appointment)


# ---------------------------------------------------------------------------
# Update appointment
# ---------------------------------------------------------------------------
@router.put("/{id}", response_model=AppointmentEnriched)
def update_appointment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    appointment_in: AppointmentCreate,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    appointment = (
        db.query(Appointment)
        .options(joinedload(Appointment.patient), joinedload(Appointment.service))
        .filter(Appointment.id == id)
        .first()
    )
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = appointment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)
    return _enrich_appointment(appointment)


# ---------------------------------------------------------------------------
# Delete appointment (cancel it)
# ---------------------------------------------------------------------------
@router.delete("/{id}")
def delete_appointment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = AppointmentStatus.CANCELLED
    db.commit()
    return {"detail": f"Appointment {id} marked as cancelled"}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _enrich_appointment(a: Appointment) -> AppointmentEnriched:
    return AppointmentEnriched(
        id=a.id,
        patient_id=a.patient_id,
        patient_name=a.patient.full_name if a.patient else f"Patient #{a.patient_id}",
        service_id=a.service_id,
        service_name=a.service.name if a.service else f"Service #{a.service_id}",
        start_at=a.start_at,
        end_at=a.end_at,
        status=a.status,
        source_channel=a.source_channel,
        booked_by_ai=a.booked_by_ai,
        notes=a.notes,
        created_at=a.created_at,
    )
