from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.schemas.alert import AlertOut
from app.core.database import get_supabase
from loguru import logger
from typing import List

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/{patient_id}", response_model=List[AlertOut])
def get_patient_alerts(
    patient_id: str,
    unacknowledged_only: bool = False,
    db: Client = Depends(get_supabase),
):
    """Retrieve all alerts for a patient, optionally filtered to unacknowledged only."""
    try:
        query = (
            db.table("alerts")
            .select("*")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
        )
        if unacknowledged_only:
            query = query.eq("is_acknowledged", False)
        response = query.execute()
        
        FE_SEV_MAP = {"high": "Warning", "critical": "Critical"}
        alerts = response.data or []
        for a in alerts:
            a["severity"] = FE_SEV_MAP.get(a.get("severity"), "Warning")
            a["acknowledged"] = a.get("is_acknowledged", False)
            a["vital_reading_id"] = a.get("vital_id")
        return alerts
    except Exception as e:
        logger.error(f"Error fetching alerts for {patient_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge_alert(alert_id: str, db: Client = Depends(get_supabase)):
    """Mark an alert as acknowledged by a clinician or patient."""
    try:
        response = (
            db.table("alerts")
            .update({"is_acknowledged": True})
            .eq("id", alert_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Alert not found")
            
        a = response.data[0]
        FE_SEV_MAP = {"high": "Warning", "critical": "Critical"}
        a["severity"] = FE_SEV_MAP.get(a.get("severity"), "Warning")
        a["acknowledged"] = a.get("is_acknowledged", True)
        a["vital_reading_id"] = a.get("vital_id")
        return a
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error acknowledging alert {alert_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[AlertOut])
def get_all_alerts(limit: int = 50, db: Client = Depends(get_supabase)):
    """Get all recent alerts across all patients (clinician dashboard view)."""
    try:
        response = (
            db.table("alerts")
            .select("*, patients(name)")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        
        FE_SEV_MAP = {"high": "Warning", "critical": "Critical"}
        alerts = response.data or []
        for a in alerts:
            a["severity"] = FE_SEV_MAP.get(a.get("severity"), "Warning")
            a["acknowledged"] = a.get("is_acknowledged", False)
            a["vital_reading_id"] = a.get("vital_id")
        return alerts
    except Exception as e:
        logger.error(f"Error fetching all alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))