from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_admin_or_driver

router = APIRouter(prefix="/api/fuel", tags=["Fuel Logs"])


@router.get("/", response_model=List[schemas.FuelLogOut])
def list_fuel_logs(
    vehicle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(models.FuelLog).options(joinedload(models.FuelLog.vehicle))
    if vehicle_id:
        query = query.filter(models.FuelLog.vehicle_id == vehicle_id)
    return query.order_by(models.FuelLog.id.desc()).all()


@router.post("/", response_model=schemas.FuelLogOut, status_code=201)
def create_fuel_log(
    payload: schemas.FuelLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin_or_driver),
):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    record = models.FuelLog(**payload.model_dump(), recorded_by_id=current_user.id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_fuel_log(record_id: int, db: Session = Depends(get_db), _=Depends(require_admin_or_driver)):
    record = db.query(models.FuelLog).filter(models.FuelLog.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    db.delete(record)
    db.commit()
    return None
