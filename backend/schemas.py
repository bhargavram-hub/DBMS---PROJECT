from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

from .models import (
    RoleEnum, VehicleStatus, VehicleType, DriverStatus,
    BookingStatus, MaintenanceStatus, DocumentType,
)


# ---------- Auth / Users ----------

class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    phone: Optional[str] = None
    role: RoleEnum = RoleEnum.employee


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: RoleEnum
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Drivers ----------

class DriverBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    license_number: str = Field(min_length=3, max_length=50)
    phone: Optional[str] = None
    status: DriverStatus = DriverStatus.available


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    license_number: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[DriverStatus] = None


class DriverOut(DriverBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Vehicles ----------

class VehicleBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    registration_number: str = Field(min_length=8, max_length=11)
    type: VehicleType = VehicleType.sedan
    capacity: int = Field(default=4, ge=1, le=100)
    status: VehicleStatus = VehicleStatus.available

    @field_validator("registration_number")
    @classmethod
    def validate_registration_number(cls, value: str) -> str:
        value = value.upper().replace(" ", "").replace("-", "")

        # Telangana registration format:
        # TS09AB1234
        # TG09AB1234
        import re

        if not re.fullmatch(r"(TS|TG)\d{2}[A-Z]{1,3}\d{4}", value):
            raise ValueError(
                "Invalid registration number. Use format TS09AB1234 or TG09AB1234."
            )

        return value


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    registration_number: Optional[str] = None
    type: Optional[VehicleType] = None
    capacity: Optional[int] = None
    status: Optional[VehicleStatus] = None


class VehicleOut(VehicleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Bookings ----------

class BookingBase(BaseModel):
    vehicle_id: int
    driver_id: Optional[int] = None
    purpose: str = Field(min_length=2, max_length=255)
    start_location: str
    end_location: str
    start_time: datetime
    end_time: Optional[datetime] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    driver_id: Optional[int] = None
    purpose: Optional[str] = None
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[BookingStatus] = None


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    requested_by_id: int
    driver_id: Optional[int] = None
    purpose: str
    start_location: str
    end_location: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: BookingStatus
    created_at: datetime
    vehicle: Optional[VehicleOut] = None
    driver: Optional[DriverOut] = None
    requested_by_user: Optional[UserOut] = None


# ---------- Maintenance ----------

class MaintenanceBase(BaseModel):
    vehicle_id: int
    service_type: str = Field(min_length=2, max_length=120)
    description: Optional[str] = None
    cost: float = Field(default=0.0, ge=0)
    service_date: date
    next_due_date: Optional[date] = None
    status: MaintenanceStatus = MaintenanceStatus.scheduled


class MaintenanceCreate(MaintenanceBase):
    pass


class MaintenanceUpdate(BaseModel):
    service_type: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    service_date: Optional[date] = None
    next_due_date: Optional[date] = None
    status: Optional[MaintenanceStatus] = None


class MaintenanceOut(MaintenanceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    vehicle: Optional[VehicleOut] = None


# ---------- Fuel ----------

class FuelLogBase(BaseModel):
    vehicle_id: int
    liters: float = Field(gt=0)
    cost: float = Field(ge=0)
    odometer_reading: Optional[int] = None
    fuel_date: date


class FuelLogCreate(FuelLogBase):
    pass


class FuelLogOut(FuelLogBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    recorded_by_id: Optional[int] = None
    created_at: datetime
    vehicle: Optional[VehicleOut] = None


# ---------- Documents ----------

class DocumentBase(BaseModel):
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    doc_type: DocumentType
    doc_number: str = Field(min_length=1, max_length=80)
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentAttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    original_filename: str
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_at: datetime


class DocumentOut(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    attachment: Optional[DocumentAttachmentOut] = None


# ---------- Reports ----------

class DashboardStats(BaseModel):
    total_vehicles: int
    available_vehicles: int
    booked_vehicles: int
    maintenance_vehicles: int
    total_drivers: int
    available_drivers: int
    total_bookings: int
    pending_bookings: int
    ongoing_bookings: int
    completed_bookings: int
    total_fuel_cost: float
    total_maintenance_cost: float
    documents_expiring_soon: int
