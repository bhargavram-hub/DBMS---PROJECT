from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_admin

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


def _with_relations(query):
    return query.options(
        joinedload(models.Booking.vehicle),
        joinedload(models.Booking.driver),
        joinedload(models.Booking.requested_by_user),
    )


@router.get("/", response_model=List[schemas.BookingOut])
def list_bookings(
    status: Optional[str] = None,
    mine: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = _with_relations(db.query(models.Booking))
    if status:
        query = query.filter(models.Booking.status == status)
    if mine or current_user.role.value == "employee":
        query = query.filter(models.Booking.requested_by_id == current_user.id)
    return query.order_by(models.Booking.id.desc()).all()


@router.get("/{booking_id}", response_model=schemas.BookingOut)
def get_booking(booking_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    booking = _with_relations(db.query(models.Booking)).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/", response_model=schemas.BookingOut, status_code=201)
def create_booking(
    payload: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.status != models.VehicleStatus.available:
        raise HTTPException(status_code=400, detail=f"Vehicle is currently {vehicle.status.value} and cannot be booked")

    booking = models.Booking(
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        requested_by_id=current_user.id,
        purpose=payload.purpose,
        start_location=payload.start_location,
        end_location=payload.end_location,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=models.BookingStatus.pending,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _with_relations(db.query(models.Booking)).filter(models.Booking.id == booking.id).first()


@router.put("/{booking_id}", response_model=schemas.BookingOut)
def update_booking(
    booking_id: int,
    payload: schemas.BookingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    data = payload.model_dump(exclude_unset=True)
    new_status = data.get("status")

    for field, value in data.items():
        setattr(booking, field, value)

    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == booking.vehicle_id).first()
    driver = (
        db.query(models.Driver).filter(models.Driver.id == booking.driver_id).first()
        if booking.driver_id
        else None
    )

    if new_status == models.BookingStatus.approved or new_status == models.BookingStatus.ongoing:
        if vehicle:
            vehicle.status = models.VehicleStatus.booked
        if driver:
            driver.status = models.DriverStatus.on_trip
    elif new_status in (
        models.BookingStatus.completed,
        models.BookingStatus.cancelled,
        models.BookingStatus.rejected,
    ):
        if vehicle:
            vehicle.status = models.VehicleStatus.available
        if driver:
            driver.status = models.DriverStatus.available

    db.commit()
    db.refresh(booking)
    return _with_relations(db.query(models.Booking)).filter(models.Booking.id == booking.id).first()


@router.delete("/{booking_id}", status_code=204)
def delete_booking(booking_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    db.delete(booking)
    db.commit()
    return None
