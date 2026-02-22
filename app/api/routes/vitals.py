from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.schemas.vitals import VitalReading, VitalReadingOut, VitalHistoryEntry
from app.core.database import get_supabase
from app.services.risk_engine import calculate_risk
from app.services.alert_service import create_alert_if_needed
from loguru import logger
from typing import List
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/vitals", tags=["Vitals"])

# Map UI/ML expected string cases to DB constraints
DB_RISK_MAP = {"Low": "low", "Moderate": "medium", "High": "high"}
FE_RISK_MAP = {"low": "Low", "medium": "Moderate", "high": "High"}


@router.post("/{patient_id}", response_model=VitalReadingOut, status_code=201)
def submit_vitals(patient_id: str, vitals: VitalReading, db: Client = Depends(get_supabase)):
    """
    Submit a vital reading for a patient.
    Runs ML risk scoring, stores the reading, and triggers an alert if thresholds are breached.
    """
    vital_data = vitals.model_dump()

    # Run risk engine
    risk_result = calculate_risk(vital_data)

    record = {
        **vital_data,
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "risk_score": risk_result["risk_score"],
        "risk_level": DB_RISK_MAP.get(risk_result["risk_level"], "low"),
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        response = db.table("vitals").insert(record).execute()
        saved = response.data[0]
    except Exception as e:
        logger.error(f"Error saving vitals for {patient_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Trigger alert if needed
    alert = create_alert_if_needed(
        supabase=db,
        patient_id=patient_id,
        vital_reading_id=saved["id"],
        risk_level=risk_result["risk_level"],
        risk_score=risk_result["risk_score"],
        vital_data=vital_data,
    )

    # Map risk_level back to frontend format
    saved["risk_level"] = FE_RISK_MAP.get(saved.get("risk_level"), saved.get("risk_level"))

    return {
        **saved,
        "recommendations": risk_result["recommendations"],
        "alert_triggered": alert is not None,
    }


@router.get("/{patient_id}", response_model=List[VitalHistoryEntry])
def get_vital_history(patient_id: str, limit: int = 30, db: Client = Depends(get_supabase)):
    """Retrieve the vital reading history for a patient."""
    try:
        response = (
            db.table("vitals")
            .select("*")
            .eq("patient_id", patient_id)
            .order("recorded_at", desc=True)
            .limit(limit)
            .execute()
        )
        readings = response.data or []
        for r in readings:
            r["risk_level"] = FE_RISK_MAP.get(r.get("risk_level"), r.get("risk_level"))
        return readings
    except Exception as e:
        logger.error(f"Error fetching vitals for {patient_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))