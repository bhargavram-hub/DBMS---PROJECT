from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, require_admin

router = APIRouter(prefix="/api/documents", tags=["Documents"])

BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads" / "documents"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.get("/", response_model=List[schemas.DocumentOut])
def list_documents(
    vehicle_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(models.Document)
    if vehicle_id:
        query = query.filter(models.Document.vehicle_id == vehicle_id)
    if driver_id:
        query = query.filter(models.Document.driver_id == driver_id)
    return query.order_by(models.Document.expiry_date.asc().nullslast(), models.Document.id.desc()).all()


@router.post("/", response_model=schemas.DocumentOut, status_code=201)
def create_document(
    payload: schemas.DocumentCreate, db: Session = Depends(get_db), _=Depends(require_admin)
):
    if bool(payload.vehicle_id) == bool(payload.driver_id):
        raise HTTPException(status_code=400, detail="A document must belong to exactly one vehicle or driver")
    if payload.vehicle_id and not db.query(models.Vehicle).filter(models.Vehicle.id == payload.vehicle_id).first():
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if payload.driver_id and not db.query(models.Driver).filter(models.Driver.id == payload.driver_id).first():
        raise HTTPException(status_code=404, detail="Driver not found")
    record = models.Document(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/{doc_id}/file", response_model=schemas.DocumentOut)
def upload_document_file(
    doc_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    record = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, PNG or WEBP files are allowed")

    data = file.file.read(MAX_FILE_SIZE + 1)
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must be 10 MB or less")

    if record.attachment:
        old_path = UPLOAD_DIR / record.attachment.stored_filename
        if old_path.exists():
            old_path.unlink()
        attachment = record.attachment
        stored_name = f"{uuid4().hex}_{Path(file.filename or 'document').name}"
        attachment.original_filename = file.filename or "document"
        attachment.stored_filename = stored_name
        attachment.content_type = file.content_type
        attachment.file_size = len(data)
    else:
        stored_name = f"{uuid4().hex}_{Path(file.filename or 'document').name}"
        attachment = models.DocumentAttachment(
            document_id=record.id,
            original_filename=file.filename or "document",
            stored_filename=stored_name,
            content_type=file.content_type,
            file_size=len(data),
        )
        db.add(attachment)

    (UPLOAD_DIR / stored_name).write_bytes(data)
    if not record.doc_number or record.doc_number == "NOT_UPLOADED":
        record.doc_number = Path(file.filename or "document").stem[:80]
    db.commit()
    db.refresh(record)
    return record


@router.get("/{doc_id}/download")
def download_document_file(
    doc_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    record = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not record or not record.attachment:
        raise HTTPException(status_code=404, detail="No file is attached to this document")
    path = UPLOAD_DIR / record.attachment.stored_filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Attached file is missing from storage")
    return FileResponse(path, media_type=record.attachment.content_type or "application/octet-stream", filename=record.attachment.original_filename)


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    record = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")
    if record.attachment:
        path = UPLOAD_DIR / record.attachment.stored_filename
        if path.exists():
            path.unlink()
    db.delete(record)
    db.commit()
    return None
