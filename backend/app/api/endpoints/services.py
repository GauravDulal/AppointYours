from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.models import Service, AdminUser
from app.schemas.models import Service as ServiceSchema, ServiceCreate

router = APIRouter()

@router.get("/", response_model=List[ServiceSchema])
def read_services(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0),
    limit: int = Query(100),
    is_active: bool | None = Query(None),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    query = db.query(Service)
    if is_active is not None:
        query = query.filter(Service.is_active == is_active)
    services = query.offset(skip).limit(limit).all()
    return services

@router.post("/", response_model=ServiceSchema)
def create_service(
    *,
    db: Session = Depends(deps.get_db),
    service_in: ServiceCreate,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    service = Service(**service_in.dict())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.get("/{id}", response_model=ServiceSchema)
def read_service(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@router.put("/{id}", response_model=ServiceSchema)
def update_service(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    service_in: ServiceCreate,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    update_data = service_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)
    return service

@router.delete("/{id}")
def delete_service(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    service = db.query(Service).filter(Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"detail": f"Service {id} deleted"}
