from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_admin

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])


@router.get("/", response_model=List[schemas.MaintenanceOut])
def list_maintenance(
    vehicle_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(models.Maintenance).options(joinedload(models.Maintenance.vehicle))
    if vehicle_id:
        query = query.filter(models.Maintenance.vehicle_id == vehicle_id)
    if status:
        query = query.filter(models.Maintenance.status == status)
    return query.order_by(models.Maintenance.id.desc()).all()


@router.post("/", response_model=schemas.MaintenanceOut, status_code=201)
def create_maintenance(
    payload: schemas.MaintenanceCreate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    record = models.Maintenance(**payload.model_dump())
    db.add(record)

    if record.status in (models.MaintenanceStatus.scheduled, models.MaintenanceStatus.in_progress):
        vehicle.status = models.VehicleStatus.maintenance

    db.commit()
    db.refresh(record)
    return record


@router.put("/{record_id}", response_model=schemas.MaintenanceOut)
def update_maintenance(
    record_id: int,
    payload: schemas.MaintenanceUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    record = db.query(models.Maintenance).filter(models.Maintenance.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == record.vehicle_id).first()
    if vehicle:
        if record.status == models.MaintenanceStatus.completed:
            vehicle.status = models.VehicleStatus.available
        else:
            vehicle.status = models.VehicleStatus.maintenance

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=204)
def delete_maintenance(record_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    record = db.query(models.Maintenance).filter(models.Maintenance.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    db.delete(record)
    db.commit()
    return None
