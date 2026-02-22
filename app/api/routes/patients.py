from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.schemas.patient import PatientCreate, PatientRead, PatientUpdate
from app.core.database import get_supabase
from loguru import logger
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("/", response_model=PatientRead, status_code=201)
def create_patient(patient: PatientCreate, db: Client = Depends(get_supabase)):
    """Register a new patient profile."""
    data = patient.model_dump()
    # Generate defaults that SQLAlchemy normally handles but Supabase client doesn't
    now = datetime.now(timezone.utc).isoformat()
    data["id"] = str(uuid.uuid4())
    data["created_at"] = now
    data["updated_at"] = now
    try:
        response = db.table("patients").insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating patient: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[PatientRead])
def list_patients(db: Client = Depends(get_supabase)):
    """List all registered patients."""
    try:
        response = db.table("patients").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error listing patients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(patient_id: str, db: Client = Depends(get_supabase)):
    """Get a single patient by ID."""
    try:
        response = db.table("patients").select("*").eq("id", patient_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{patient_id}", response_model=PatientRead)
def update_patient(patient_id: str, updates: PatientUpdate, db: Client = Depends(get_supabase)):
    """Update patient profile fields."""
    data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        response = db.table("patients").update(data).eq("id", patient_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Patient not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: str, db: Client = Depends(get_supabase)):
    """Delete a patient profile."""
    try:
        db.table("patients").delete().eq("id", patient_id).execute()
    except Exception as e:
        logger.error(f"Error deleting patient {patient_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))