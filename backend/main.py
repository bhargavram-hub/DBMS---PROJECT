from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .config import settings
from .database import engine
from .routers import auth, vehicles, drivers, bookings, maintenance, fuel, documents, reports

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Vehicle Booking & Management System API",
    description="REST API for managing vehicles, drivers, bookings, maintenance, fuel and documents.",
    version="1.0.0",
)

origins = [
    settings.frontend_origin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(bookings.router)
app.include_router(maintenance.router)
app.include_router(fuel.router)
app.include_router(documents.router)
app.include_router(reports.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "Smart Vehicle Booking & Management System API"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
