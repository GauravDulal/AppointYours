from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.models import AvailabilityRule, BlockedDate, AdminUser
from app.schemas.models import (
    AvailabilityRule as AvailabilityRuleSchema, 
    AvailabilityRuleCreate,
    BlockedDate as BlockedDateSchema,
    BlockedDateCreate
)

router = APIRouter()

@router.get("/rules", response_model=List[AvailabilityRuleSchema])
def read_availability_rules(
    db: Session = Depends(deps.get_db),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    return db.query(AvailabilityRule).all()

@router.post("/rules", response_model=AvailabilityRuleSchema)
def create_availability_rule(
    *,
    db: Session = Depends(deps.get_db),
    rule_in: AvailabilityRuleCreate,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    rule = AvailabilityRule(**rule_in.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{id}")
def delete_availability_rule(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    rule = db.query(AvailabilityRule).filter(AvailabilityRule.id == id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"status": "success"}

@router.get("/blocked", response_model=List[BlockedDateSchema])
def read_blocked_dates(
    db: Session = Depends(deps.get_db),
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    return db.query(BlockedDate).all()

@router.post("/blocked", response_model=BlockedDateSchema)
def create_blocked_date(
    *,
    db: Session = Depends(deps.get_db),
    blocked_in: BlockedDateCreate,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    blocked = BlockedDate(**blocked_in.dict())
    db.add(blocked)
    db.commit()
    db.refresh(blocked)
    return blocked

@router.delete("/blocked/{id}")
def delete_blocked_date(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: AdminUser = Depends(deps.get_current_user),
) -> Any:
    blocked = db.query(BlockedDate).filter(BlockedDate.id == id).first()
    if not blocked:
        raise HTTPException(status_code=404, detail="Blocked date not found")
    db.delete(blocked)
    db.commit()
    return {"status": "success"}
