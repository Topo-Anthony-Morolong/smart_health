from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.core.database import get_supabase
from app.services.analytics import compute_analytics
from loguru import logger

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/{patient_id}")
def get_analytics(patient_id: str, db: Client = Depends(get_supabase)):
    """
    Return trend analysis for a patient based on their vital history:
    averages, risk distribution, deterioration flag, and trend direction.
    """
    try:
        response = (
            db.table("vitals")
            .select("*")
            .eq("patient_id", patient_id)
            .order("recorded_at", desc=True)
            .limit(90)  # Last 90 readings
            .execute()
        )
        readings = response.data or []
        FE_RISK_MAP = {"low": "Low", "medium": "Moderate", "high": "High"}
        for r in readings:
            r["risk_level"] = FE_RISK_MAP.get(r.get("risk_level"), r.get("risk_level"))
        return compute_analytics(patient_id, readings)
    except Exception as e:
        logger.error(f"Error computing analytics for {patient_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))