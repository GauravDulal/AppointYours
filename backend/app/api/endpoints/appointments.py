from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.models import Appointment, AdminUser, AppointmentStatus
from app.schemas.models import Appointment as AppointmentSchema, AppointmentCreate

router = APIRouter()


# ---------------------------------------------------------------------------
# Get summary stats (MUST come before /{id})
# ---------------------------------------------------------------------------
@router.get("/summary")
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

    return {
        "total": total,
        "booked": booked,
        "completed": completed,
        "cancelled": cancelled,
        "completion_rate_pct": round(completed_pct, 1),
        "cancellation_rate_pct": round(cancelled_pct, 1),
    }


# ---------------------------------------------------------------------------
# List appointments with filters
# ---------------------------------------------------------------------------
@router.get("/", response_model=List[AppointmentSchema])
def read_appointments(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0),
    limit: int = Query(100),
    status: AppointmentStatus | None = Query(None),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    query = db.query(Appointment)
    if status:
        query = query.filter(Appointment.status == status)
    appointments = query.order_by(Appointment.start_at.desc()).offset(skip).limit(limit).all()
    return appointments


# ---------------------------------------------------------------------------
# Create appointment
# ---------------------------------------------------------------------------
@router.post("/", response_model=AppointmentSchema)
def create_appointment(
    *,
    db: Session = Depends(deps.get_db),
    appointment_in: AppointmentCreate,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    appointment = Appointment(**appointment_in.dict())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


# ---------------------------------------------------------------------------
# Get single appointment
# ---------------------------------------------------------------------------
@router.get("/{id}", response_model=AppointmentSchema)
def read_appointment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


# ---------------------------------------------------------------------------
# Update appointment
# ---------------------------------------------------------------------------
@router.put("/{id}", response_model=AppointmentSchema)
def update_appointment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    appointment_in: AppointmentCreate,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = appointment_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)
    return appointment


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
