"""
Seeds the database with an admin account, sample drivers, vehicles,
bookings, maintenance, fuel and document records so the app is demo-ready
immediately after setup.

Run with:  python -m app.seed
"""
from datetime import datetime, date, timedelta

from . import models
from .auth import hash_password
from .database import Base, engine, SessionLocal

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    if db.query(models.User).count() > 0:
        print("Database already has data — skipping seed. Delete the DB file to reseed.")
    else:
        print("Seeding database...")

        # ---- Users ----
        admin = models.User(
            full_name="Admin User",
            email="admin@fleet.com",
            hashed_password=hash_password("Admin@123"),
            phone="9990000001",
            role=models.RoleEnum.admin,
        )
        driver_user = models.User(
            full_name="Ravi Kumar",
            email="driver@fleet.com",
            hashed_password=hash_password("Driver@123"),
            phone="9990000002",
            role=models.RoleEnum.driver,
        )
        employee = models.User(
            full_name="Anjali Sharma",
            email="employee@fleet.com",
            hashed_password=hash_password("Employee@123"),
            phone="9990000003",
            role=models.RoleEnum.employee,
        )
        db.add_all([admin, driver_user, employee])
        db.commit()
        db.refresh(admin)
        db.refresh(driver_user)
        db.refresh(employee)

        # ---- Drivers ----
        d1 = models.Driver(
            user_id=driver_user.id,
            full_name="Ravi Kumar",
            license_number="DL-0420110012345",
            phone="9990000002",
            status=models.DriverStatus.available,
        )
        d2 = models.Driver(
            full_name="Suresh Patil",
            license_number="MH-1220180067890",
            phone="9990000004",
            status=models.DriverStatus.available,
        )
        d3 = models.Driver(
            full_name="Mohammed Iqbal",
            license_number="KA-0520190054321",
            phone="9990000005",
            status=models.DriverStatus.off_duty,
        )
        db.add_all([d1, d2, d3])
        db.commit()
        for d in (d1, d2, d3):
            db.refresh(d)

        # ---- Vehicles ----
        v1 = models.Vehicle(name="Toyota Innova Crysta", registration_number="TS-09-AB-1234", type=models.VehicleType.suv, capacity=7, status=models.VehicleStatus.available)
        v2 = models.Vehicle(name="Maruti Suzuki Dzire", registration_number="TS-09-CD-5678", type=models.VehicleType.sedan, capacity=4, status=models.VehicleStatus.booked)
        v3 = models.Vehicle(name="Tata Ace Gold", registration_number="TS-09-EF-9012", type=models.VehicleType.truck, capacity=2, status=models.VehicleStatus.maintenance)
        v4 = models.Vehicle(name="Force Traveller", registration_number="TS-09-GH-3456", type=models.VehicleType.van, capacity=12, status=models.VehicleStatus.available)
        v5 = models.Vehicle(name="Honda Activa", registration_number="TS-09-IJ-7890", type=models.VehicleType.bike, capacity=1, status=models.VehicleStatus.available)
        db.add_all([v1, v2, v3, v4, v5])
        db.commit()
        for v in (v1, v2, v3, v4, v5):
            db.refresh(v)

        # ---- Bookings ----
        b1 = models.Booking(
            vehicle_id=v2.id, requested_by_id=employee.id, driver_id=d1.id,
            purpose="Client site visit", start_location="HQ Office", end_location="Client Campus",
            start_time=datetime.utcnow() + timedelta(hours=2),
            status=models.BookingStatus.approved,
        )
        b2 = models.Booking(
            vehicle_id=v1.id, requested_by_id=employee.id,
            purpose="Airport pickup for guests", start_location="HQ Office", end_location="Airport",
            start_time=datetime.utcnow() + timedelta(days=1),
            status=models.BookingStatus.pending,
        )
        b3 = models.Booking(
            vehicle_id=v4.id, requested_by_id=admin.id, driver_id=d2.id,
            purpose="Team offsite transport", start_location="HQ Office", end_location="Resort",
            start_time=datetime.utcnow() - timedelta(days=3),
            end_time=datetime.utcnow() - timedelta(days=3) + timedelta(hours=5),
            status=models.BookingStatus.completed,
        )
        db.add_all([b1, b2, b3])

        # ---- Maintenance ----
        m1 = models.Maintenance(
            vehicle_id=v3.id, service_type="Engine Overhaul", description="Full engine service and oil change",
            cost=15500.0, service_date=date.today() - timedelta(days=2),
            next_due_date=date.today() + timedelta(days=178),
            status=models.MaintenanceStatus.in_progress,
        )
        m2 = models.Maintenance(
            vehicle_id=v1.id, service_type="Routine Service", description="Oil change, brake check",
            cost=3200.0, service_date=date.today() - timedelta(days=40),
            next_due_date=date.today() + timedelta(days=140),
            status=models.MaintenanceStatus.completed,
        )
        db.add_all([m1, m2])

        # ---- Fuel Logs ----
        f1 = models.FuelLog(vehicle_id=v1.id, liters=42.5, cost=4250.0, odometer_reading=18234, fuel_date=date.today() - timedelta(days=3), recorded_by_id=admin.id)
        f2 = models.FuelLog(vehicle_id=v2.id, liters=30.0, cost=3000.0, odometer_reading=9820, fuel_date=date.today() - timedelta(days=1), recorded_by_id=admin.id)
        f3 = models.FuelLog(vehicle_id=v4.id, liters=55.0, cost=5500.0, odometer_reading=42110, fuel_date=date.today() - timedelta(days=6), recorded_by_id=admin.id)
        db.add_all([f1, f2, f3])

        # ---- Documents ----
        doc1 = models.Document(vehicle_id=v1.id, doc_type=models.DocumentType.insurance, doc_number="INS-2026-9911", issue_date=date.today() - timedelta(days=200), expiry_date=date.today() + timedelta(days=20))
        doc2 = models.Document(vehicle_id=v2.id, doc_type=models.DocumentType.registration, doc_number="REG-TS09CD5678", issue_date=date.today() - timedelta(days=800), expiry_date=date.today() + timedelta(days=900))
        doc3 = models.Document(vehicle_id=v3.id, doc_type=models.DocumentType.puc, doc_number="PUC-556432", issue_date=date.today() - timedelta(days=150), expiry_date=date.today() + timedelta(days=10))
        doc4 = models.Document(driver_id=d1.id, doc_type=models.DocumentType.license, doc_number="DL-0420110012345", issue_date=date.today() - timedelta(days=1200), expiry_date=date.today() + timedelta(days=1800))
        db.add_all([doc1, doc2, doc3, doc4])

        db.commit()

        print("Seed complete.")
        print("--------------------------------------------------")
        print(" Admin    -> admin@fleet.com    / Admin@123")
        print(" Driver   -> driver@fleet.com   / Driver@123")
        print(" Employee -> employee@fleet.com / Employee@123")
        print("--------------------------------------------------")
finally:
    db.close()
