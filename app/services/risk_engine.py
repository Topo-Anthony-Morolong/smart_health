import joblib
import os
import numpy as np
from typing import Dict, Any

BASE_DIR = os.path.dirname(__file__)

# ---------------------------------------------------------------------------
# Load trained model artefacts (if available)
# ---------------------------------------------------------------------------
try:
    model = joblib.load(os.path.join(BASE_DIR, "risk_model.joblib"))
    scaler = joblib.load(os.path.join(BASE_DIR, "scaler.joblib"))
    _model_loaded = True
except Exception as e:
    _model_loaded = False
    print(f"Warning: ML model not loaded – {e}")


# ---------------------------------------------------------------------------
# Clinical recommendation library
# ---------------------------------------------------------------------------
RECOMMENDATIONS = {
    "high": [
        "🚨 Contact your doctor or care team immediately.",
        "Avoid strenuous physical activity until reviewed by a clinician.",
        "Monitor your readings every 2–4 hours and record them.",
        "Check any prescribed medications are taken on schedule.",
        "If you experience chest pain, dizziness or difficulty breathing call emergency services.",
    ],
    "medium": [
        "⚠️ Schedule a check-up with your doctor within the next 3–5 days.",
        "Reduce sodium intake and stay well hydrated.",
        "30 minutes of light exercise (e.g. walking) daily is recommended.",
        "Continue your prescribed medications and do not skip doses.",
        "Monitor readings daily and log any changes.",
    ],
    "low": [
        "✅ Your vitals look stable — keep up the good work!",
        "Maintain a balanced diet with plenty of vegetables and whole grains.",
        "Aim for at least 30 minutes of moderate exercise most days.",
        "Stay hydrated and limit alcohol and caffeine.",
        "Continue routine monitoring as advised by your care team.",
    ],
}


def calculate_risk(vital_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run the ML risk model or rule-based fallback against patient vitals.
    Uses the actual table column names: heart_rate, blood_pressure_systolic,
    blood_pressure_diastolic, temperature, oxygen_saturation.
    """
    if not _model_loaded:
        return _rule_based_fallback(vital_data)

    # Map DB column names to the 6 model features the trained model expects
    # Model was trained on: chol, hdl, age, weight, bp.1s, bp.1d
    # We map available vitals as best we can:
    features = np.array([[
        vital_data.get("heart_rate", 72),       # feature 1
        vital_data.get("oxygen_saturation", 97), # feature 2
        50,                                      # age placeholder
        70,                                      # weight placeholder
        vital_data.get("blood_pressure_systolic", 120),
        vital_data.get("blood_pressure_diastolic", 80),
    ]])

    scaled = scaler.transform(features)
    probability = float(model.predict_proba(scaled)[0][1])
    risk_level = _stratify(probability)

    return {
        "risk_score": round(probability, 4),
        "risk_level": risk_level,
        "recommendations": RECOMMENDATIONS[risk_level],
    }


def _stratify(probability: float) -> str:
    if probability >= 0.7:
        return "high"
    elif probability >= 0.4:
        return "medium"
    return "low"


def _rule_based_fallback(vital_data: Dict[str, Any]) -> Dict[str, Any]:
    """Simple threshold-based fallback when ML model is unavailable."""
    score = 0.2
    bp_s = vital_data.get("blood_pressure_systolic", 120)
    hr = vital_data.get("heart_rate", 72)
    spo2 = vital_data.get("oxygen_saturation", 97)
    temp = vital_data.get("temperature", 37.0)

    # High risk thresholds
    if bp_s >= 180 or hr >= 120 or spo2 <= 90 or temp >= 39.5:
        score = 0.80
    # Moderate risk thresholds
    elif bp_s >= 140 or hr >= 100 or spo2 <= 94 or temp >= 38.5:
        score = 0.50

    risk_level = _stratify(score)
    return {
        "risk_score": round(score, 4),
        "risk_level": risk_level,
        "recommendations": RECOMMENDATIONS[risk_level],
    }