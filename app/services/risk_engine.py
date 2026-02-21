import joblib
import os
import numpy as np
from typing import Dict, Any

BASE_DIR = os.path.dirname(__file__)

# ---------------------------------------------------------------------------
# Load trained model artefacts
# Model features (in order): chol, hdl, age, weight, bp.1s, bp.1d
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
    "High": [
        "🚨 Contact your doctor or care team immediately.",
        "Avoid strenuous physical activity until reviewed by a clinician.",
        "Monitor your readings every 2–4 hours and record them.",
        "Check any prescribed medications are taken on schedule.",
        "If you experience chest pain, dizziness or difficulty breathing call emergency services.",
    ],
    "Moderate": [
        "⚠️ Schedule a check-up with your doctor within the next 3–5 days.",
        "Reduce sodium intake and stay well hydrated.",
        "30 minutes of light exercise (e.g. walking) daily is recommended.",
        "Continue your prescribed medications and do not skip doses.",
        "Monitor readings daily and log any changes.",
    ],
    "Low": [
        "✅ Your vitals look stable — keep up the good work!",
        "Maintain a balanced diet with plenty of vegetables and whole grains.",
        "Aim for at least 30 minutes of moderate exercise most days.",
        "Stay hydrated and limit alcohol and caffeine.",
        "Continue routine monitoring as advised by your care team.",
    ],
}


def calculate_risk(vital_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run the ML risk model against the six core features and return
    a risk score, risk level label, and tailored recommendations.
    """
    if not _model_loaded:
        # Graceful fallback when model artefacts are missing
        return _rule_based_fallback(vital_data)

    features = np.array([[
        vital_data.get("cholesterol", 200),
        vital_data.get("hdl", 50),
        vital_data.get("age", 50),
        vital_data.get("weight", 75),
        vital_data.get("bp_systolic", 120),
        vital_data.get("bp_diastolic", 80),
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
        return "High"
    elif probability >= 0.4:
        return "Moderate"
    return "Low"


def _rule_based_fallback(vital_data: Dict[str, Any]) -> Dict[str, Any]:
    """Simple threshold-based fallback when ML model is unavailable."""
    score = 0.2
    bp_s = vital_data.get("bp_systolic", 120)
    chol = vital_data.get("cholesterol", 200)
    glucose = vital_data.get("glucose", 100)

    if bp_s >= 160 or chol >= 240 or (glucose and glucose >= 200):
        score = 0.80
    elif bp_s >= 130 or chol >= 200 or (glucose and glucose >= 140):
        score = 0.50

    risk_level = _stratify(score)
    return {
        "risk_score": round(score, 4),
        "risk_level": risk_level,
        "recommendations": RECOMMENDATIONS[risk_level],
    }