# Vehicle Booking Management System — Backend

FastAPI + SQLAlchemy REST API for the Smart Vehicle Booking & Management System.

## Tech Stack
- **Framework:** FastAPI (async-ready, auto-generated OpenAPI docs)
- **ORM:** SQLAlchemy 2.x
- **Database:** MySQL 8.x via SQLAlchemy + PyMySQL
- **Auth:** JWT (python-jose) + bcrypt password hashing (passlib)
- **Validation:** Pydantic v2

## 1. Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
```

Copy `.env.example` to `.env`. The provided configuration uses MySQL. If your MySQL root password is different, update `DATABASE_URL` in `.env`:

```env
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/vehicle_booking_db
```

Create the empty MySQL database first:
```sql
CREATE DATABASE vehicle_booking_db CHARACTER SET utf8mb4;
```

## 2. Seed demo data (recommended)

```bash
python -m app.seed
```

This creates three demo accounts and sample vehicles/drivers/bookings/maintenance/fuel/document records:

| Role     | Email               | Password      |
|----------|---------------------|---------------|
| Admin    | admin@fleet.com     | Admin@123     |
| Driver   | driver@fleet.com    | Driver@123    |
| Employee | employee@fleet.com  | Employee@123  |

## 3. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

- API base URL: `http://localhost:8000`
- Interactive API docs (Swagger UI): `http://localhost:8000/docs`
- Alternative docs (ReDoc): `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app, CORS, router registration
│   ├── config.py        # Environment-based settings
│   ├── database.py      # SQLAlchemy engine/session
│   ├── models.py        # ORM models (User, Vehicle, Driver, Booking, ...)
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── auth.py           # Password hashing + JWT helpers
│   ├── deps.py            # Auth dependency / role guards
│   ├── seed.py            # Demo data seeder
│   └── routers/
│       ├── auth.py
│       ├── vehicles.py
│       ├── drivers.py
│       ├── bookings.py
│       ├── maintenance.py
│       ├── fuel.py
│       ├── documents.py
│       └── reports.py
├── requirements.txt
└── .env.example
```

## API Overview

| Module        | Base Path          | Notes                                             |
|----------------|---------------------|----------------------------------------------------|
| Auth           | `/api/auth`         | register, login, login-json, me                   |
| Vehicles       | `/api/vehicles`     | full CRUD, admin-only write                        |
| Drivers        | `/api/drivers`      | full CRUD, admin-only write                        |
| Bookings       | `/api/bookings`     | request/approve/reject/start/complete workflow     |
| Maintenance    | `/api/maintenance`  | logs service records, syncs vehicle status         |
| Fuel Logs      | `/api/fuel`         | admin/driver can log fuel entries                  |
| Documents      | `/api/documents`    | registration/insurance/PUC/license tracking        |
| Reports        | `/api/reports`      | `/dashboard` aggregate stats                       |

All endpoints except `/api/auth/register` and `/api/auth/login*` require a
`Authorization: Bearer <token>` header.

## Roles

- **admin** — full access to every module
- **driver** — can view everything, log fuel/maintenance
- **employee** — can request bookings and view their own trips

## Notes for the report / viva

- Uses **JWT + RBAC** for authentication and role-based access control (per CO3).
- Vehicle/driver status automatically transitions (`available` → `booked`/`on_trip`
  → `available`) as bookings move through their lifecycle — demonstrates applied
  relational integrity and transactional thinking.
- Swap `DATABASE_URL` to MySQL with zero code changes — demonstrates the
  database-agnostic design taught via SQLAlchemy in CO1/CO2.

## Document file attachments
The Documents, Vehicles and Drivers pages support PDF/JPG/PNG/WEBP attachments. Files are stored under `backend/uploads/documents/` and linked to records in the `document_attachments` table.

After the normal seed data is present, run:

    python -m app.seed_attachments

This creates demo PDF attachments for document records that do not already have a file, so the Download action can be demonstrated.
