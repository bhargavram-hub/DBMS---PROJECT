"""Create demo PDF attachments for the document records already in the database.
Run once after the normal seed: python -m app.seed_attachments
"""
from pathlib import Path
from uuid import uuid4

from . import models
from .database import SessionLocal

BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads" / "documents"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def make_pdf(path: Path, title: str, lines: list[str]):
    def esc(value):
        return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    content = ["BT", "/F1 18 Tf", "72 740 Td", f"({esc(title)}) Tj", "/F1 11 Tf"]
    for line in lines:
        content += ["0 -24 Td", f"({esc(line)}) Tj"]
    content += ["ET"]
    stream = "\n".join(content).encode("latin-1", "replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, obj in enumerate(objects, 1):
        offsets.append(len(pdf))
        pdf += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"
    xref = len(pdf)
    pdf += f"xref\n0 {len(objects)+1}\n".encode()
    pdf += b"0000000000 65535 f \n"
    for off in offsets[1:]:
        pdf += f"{off:010d} 00000 n \n".encode()
    pdf += f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    path.write_bytes(pdf)


db = SessionLocal()
try:
    docs = db.query(models.Document).order_by(models.Document.id.asc()).all()
    created = 0
    for doc in docs:
        if doc.attachment:
            continue
        owner = f"Vehicle ID: {doc.vehicle_id}" if doc.vehicle_id else f"Driver ID: {doc.driver_id}"
        label = doc.notes or doc.doc_type.value.title()
        filename = f"demo_{doc.id}_{doc.doc_type.value}.pdf"
        path = UPLOAD_DIR / filename
        make_pdf(path, f"Smart Vehicle Booking - {label}", [
            "Demo attachment for project presentation/testing.",
            owner,
            f"Document Number: {doc.doc_number}",
            f"Issue Date: {doc.issue_date or 'Not specified'}",
            f"Expiry Date: {doc.expiry_date or 'Not specified'}",
        ])
        db.add(models.DocumentAttachment(
            document_id=doc.id,
            original_filename=filename,
            stored_filename=filename,
            content_type="application/pdf",
            file_size=path.stat().st_size,
        ))
        created += 1
    db.commit()
    print(f"Created {created} demo document attachments.")
finally:
    db.close()
