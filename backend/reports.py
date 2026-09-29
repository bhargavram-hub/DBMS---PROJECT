from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/dashboard", response_model=schemas.DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total_vehicles = db.query(func.count(models.Vehicle.id)).scalar() or 0
    available_vehicles = (
        db.query(func.count(models.Vehicle.id))
        .filter(models.Vehicle.status == models.VehicleStatus.available)
        .scalar()
        or 0
    )
    booked_vehicles = (
        db.query(func.count(models.Vehicle.id))
        .filter(models.Vehicle.status == models.VehicleStatus.booked)
        .scalar()
        or 0
    )
    maintenance_vehicles = (
        db.query(func.count(models.Vehicle.id))
        .filter(models.Vehicle.status == models.VehicleStatus.maintenance)
        .scalar()
        or 0
    )

    total_drivers = db.query(func.count(models.Driver.id)).scalar() or 0
    available_drivers = (
        db.query(func.count(models.Driver.id))
        .filter(models.Driver.status == models.DriverStatus.available)
        .scalar()
        or 0
    )

    total_bookings = db.query(func.count(models.Booking.id)).scalar() or 0
    pending_bookings = (
        db.query(func.count(models.Booking.id))
        .filter(models.Booking.status == models.BookingStatus.pending)
        .scalar()
        or 0
    )
    ongoing_bookings = (
        db.query(func.count(models.Booking.id))
        .filter(models.Booking.status == models.BookingStatus.ongoing)
        .scalar()
        or 0
    )
    completed_bookings = (
        db.query(func.count(models.Booking.id))
        .filter(models.Booking.status == models.BookingStatus.completed)
        .scalar()
        or 0
    )

    total_fuel_cost = db.query(func.coalesce(func.sum(models.FuelLog.cost), 0.0)).scalar() or 0.0
    total_maintenance_cost = (
        db.query(func.coalesce(func.sum(models.Maintenance.cost), 0.0)).scalar() or 0.0
    )

    soon = date.today() + timedelta(days=30)
    documents_expiring_soon = (
        db.query(func.count(models.Document.id))
        .filter(models.Document.expiry_date.isnot(None))
        .filter(models.Document.expiry_date <= soon)
        .filter(models.Document.expiry_date >= date.today())
        .scalar()
        or 0
    )

    return schemas.DashboardStats(
        total_vehicles=total_vehicles,
        available_vehicles=available_vehicles,
        booked_vehicles=booked_vehicles,
        maintenance_vehicles=maintenance_vehicles,
        total_drivers=total_drivers,
        available_drivers=available_drivers,
        total_bookings=total_bookings,
        pending_bookings=pending_bookings,
        ongoing_bookings=ongoing_bookings,
        completed_bookings=completed_bookings,
        total_fuel_cost=float(total_fuel_cost),
        total_maintenance_cost=float(total_maintenance_cost),
        documents_expiring_soon=documents_expiring_soon,
    )
