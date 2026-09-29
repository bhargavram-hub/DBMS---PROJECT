import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Text, Enum, ForeignKey
)
from sqlalchemy.orm import relationship

from .database import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    driver = "driver"
    employee = "employee"


class VehicleStatus(str, enum.Enum):
    available = "available"
    booked = "booked"
    maintenance = "maintenance"
    inactive = "inactive"


class VehicleType(str, enum.Enum):
    sedan = "sedan"
    suv = "suv"
    van = "van"
    truck = "truck"
    bus = "bus"
    bike = "bike"


class DriverStatus(str, enum.Enum):
    available = "available"
    on_trip = "on_trip"
    off_duty = "off_duty"


class BookingStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"


class MaintenanceStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"


class DocumentType(str, enum.Enum):
    registration = "registration"
    insurance = "insurance"
    puc = "puc"
    license = "license"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.employee, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    bookings = relationship("Booking", back_populates="requested_by_user", foreign_keys="Booking.requested_by_id")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    full_name = Column(String(120), nullable=False)
    license_number = Column(String(50), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    status = Column(Enum(DriverStatus), default=DriverStatus.available, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="driver_profile")
    bookings = relationship("Booking", back_populates="driver")
    documents = relationship("Document", back_populates="driver", cascade="all, delete-orphan")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    registration_number = Column(String(30), unique=True, nullable=False)
    type = Column(Enum(VehicleType), default=VehicleType.sedan, nullable=False)
    capacity = Column(Integer, default=4)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.available, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="vehicle")
    maintenance_records = relationship("Maintenance", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    documents = relationship("Document", back_populates="vehicle", cascade="all, delete-orphan")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    purpose = Column(String(255), nullable=False)
    start_location = Column(String(150), nullable=False)
    end_location = Column(String(150), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(Enum(BookingStatus), default=BookingStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="bookings")
    driver = relationship("Driver", back_populates="bookings")
    requested_by_user = relationship("User", back_populates="bookings", foreign_keys=[requested_by_id])


class Maintenance(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    service_type = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    cost = Column(Float, default=0.0)
    service_date = Column(Date, nullable=False)
    next_due_date = Column(Date, nullable=True)
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.scheduled, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="maintenance_records")


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    odometer_reading = Column(Integer, nullable=True)
    fuel_date = Column(Date, nullable=False)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    doc_type = Column(Enum(DocumentType), nullable=False)
    doc_number = Column(String(80), nullable=False)
    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="documents")
    driver = relationship("Driver", back_populates="documents")
    attachment = relationship("DocumentAttachment", back_populates="document", uselist=False, cascade="all, delete-orphan")


class DocumentAttachment(Base):
    __tablename__ = "document_attachments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False, unique=True)
    content_type = Column(String(120), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="attachment")
