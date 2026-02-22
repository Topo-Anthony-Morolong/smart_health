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
        "vital_id": vital_reading_id,
        "alert_type": alert_info["alert_type"],
        "message": alert_info["message"],
        "severity": alert_info["severity"],
        "is_acknowledged": False,
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
    """Return alert message, type and severity, or None if no alert needed."""
    bp_s = vital_data.get("blood_pressure_systolic", 0)
    bp_d = vital_data.get("blood_pressure_diastolic", 0)
    spo2 = vital_data.get("oxygen_saturation", 100)
    temp = vital_data.get("temperature", 37.0)

    # Critical hard thresholds (regardless of ML score)
    if bp_s >= 180 or bp_d >= 120:
        return {
            "alert_type": "hypertensive_crisis",
            "severity": "critical",
            "message": (
                f"Hypertensive crisis detected: BP {bp_s}/{bp_d} mmHg. "
                "Immediate medical attention required."
            ),
        }
    if spo2 <= 90:
        return {
            "alert_type": "low_oxygen",
            "severity": "critical",
            "message": (
                f"Critically low oxygen saturation: {spo2}%. "
                "Seek emergency care immediately."
            ),
        }
    if temp >= 40.0:
        return {
            "alert_type": "high_fever",
            "severity": "critical",
            "message": f"High fever: {temp} °C. Seek medical attention immediately.",
        }

    # ML model risk-level thresholds
    if risk_level == "high":
        return {
            "alert_type": "high_risk",
            "severity": "high",
            "message": (
                f"High deterioration risk detected (score: {round(risk_score * 100)}%). "
                "Clinical review recommended within 24 hours."
            ),
        }

    # Warning-level rule triggers
    if bp_s >= 160:
        return {
            "alert_type": "elevated_bp",
            "severity": "medium",
            "message": f"Elevated blood pressure: {bp_s}/{bp_d} mmHg. Please contact your care team.",
        }
    if spo2 <= 94:
        return {
            "alert_type": "low_oxygen",
            "severity": "medium",
            "message": f"Low oxygen saturation: {spo2}%. Monitor closely and rest.",
        }

    return None  # no alert needed