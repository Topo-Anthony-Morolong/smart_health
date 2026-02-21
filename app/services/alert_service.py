from loguru import logger
from typing import Optional


def create_alert_if_needed(
    supabase,
    patient_id: str,
    vital_reading_id: str,
    risk_level: str,
    risk_score: float,
    vital_data: dict,
) -> Optional[dict]:
    """
    Evaluate the risk result and rule-based thresholds.
    If an alert should be triggered, write it to Supabase and return it.
    """
    alert_info = _evaluate_thresholds(risk_level, risk_score, vital_data)
    if alert_info is None:
        return None

    record = {
        "patient_id": patient_id,
        "vital_reading_id": vital_reading_id,
        "message": alert_info["message"],
        "severity": alert_info["severity"],
        "acknowledged": False,
    }

    try:
        response = supabase.table("alerts").insert(record).execute()
        alert = response.data[0] if response.data else record
        logger.warning(
            f"Alert created for patient {patient_id}: [{alert_info['severity']}] {alert_info['message']}"
        )
        return alert
    except Exception as e:
        logger.error(f"Failed to write alert to Supabase: {e}")
        return record  # return in-memory record even if DB write fails


def _evaluate_thresholds(risk_level: str, risk_score: float, vital_data: dict) -> Optional[dict]:
    """Return alert message and severity, or None if no alert needed."""
    bp_s = vital_data.get("bp_systolic", 0)
    bp_d = vital_data.get("bp_diastolic", 0)
    chol = vital_data.get("cholesterol", 0)
    glucose = vital_data.get("glucose") or 0

    # Critical hard thresholds (regardless of ML score)
    if bp_s >= 180 or bp_d >= 120:
        return {
            "severity": "Critical",
            "message": (
                f"Hypertensive crisis detected: BP {bp_s}/{bp_d} mmHg. "
                "Immediate medical attention required."
            ),
        }
    if glucose >= 300:
        return {
            "severity": "Critical",
            "message": (
                f"Critically high blood glucose: {glucose} mg/dL. "
                "Seek emergency care immediately."
            ),
        }

    # ML model risk-level thresholds
    if risk_level == "High":
        return {
            "severity": "Warning",
            "message": (
                f"High deterioration risk detected (score: {round(risk_score * 100)}%). "
                "Clinical review recommended within 24 hours."
            ),
        }

    # Warning-level rule triggers
    if bp_s >= 160:
        return {
            "severity": "Warning",
            "message": f"Elevated blood pressure: {bp_s}/{bp_d} mmHg. Please contact your care team.",
        }
    if chol >= 240:
        return {
            "severity": "Warning",
            "message": f"High cholesterol reading: {chol} mg/dL. Schedule a lipid review.",
        }
    if glucose >= 200:
        return {
            "severity": "Warning",
            "message": f"Elevated blood glucose: {glucose} mg/dL. Monitor closely and review medications.",
        }

    return None  # no alert needed