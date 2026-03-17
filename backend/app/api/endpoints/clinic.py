from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.models import ClinicSettings, AdminUser
from app.schemas.models import ClinicSettings as ClinicSettingsSchema, ClinicSettingsCreate

router = APIRouter()

@router.get("/", response_model=ClinicSettingsSchema)
def read_clinic_settings(
    db: Session = Depends(deps.get_db),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    settings = db.query(ClinicSettings).first()
    if not settings:
        # Create default if not exists
        settings = ClinicSettings(
            clinic_name="DentalFlow Clinic",
            clinic_email="admin@dentalflow.com",
            address="123 Dental St, Medical City",
            hours_note="Mon-Fri: 9AM - 5PM",
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/", response_model=ClinicSettingsSchema)
def update_clinic_settings(
    *,
    db: Session = Depends(deps.get_db),
    settings_in: ClinicSettingsCreate,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    settings = db.query(ClinicSettings).first()
    if not settings:
        settings = ClinicSettings()
    
    update_data = settings_in.dict()
    for field in update_data:
        setattr(settings, field, update_data[field])
    
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
