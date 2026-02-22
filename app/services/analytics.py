"""
Analytics service – computes vital trends and detects deterioration
patterns from historical readings stored in Supabase.
"""
from typing import Dict, Any, List, Optional
from loguru import logger


def compute_analytics(patient_id: str, readings: List[Dict]) -> Dict[str, Any]:
    """
    Given a list of vital readings (newest first), return:
    - Average values for key vitals
    - Risk level distribution
    - Deterioration flag (consecutive risk escalations)
    - Trend direction per vital (improving / stable / worsening)
    """
    if not readings:
        return {"message": "No readings available yet.", "patient_id": patient_id}

    # Reverse so oldest → newest for trend detection
    ordered = list(reversed(readings))

    avg = _compute_averages(ordered)
    risk_dist = _risk_distribution(ordered)
    deteriorating = _detect_deterioration(ordered)
    trends = _compute_trends(ordered)
    latest = ordered[-1] if ordered else {}

    return {
        "patient_id": patient_id,
        "total_readings": len(ordered),
        "latest_risk_level": latest.get("risk_level", "Unknown"),
        "latest_risk_score": latest.get("risk_score"),
        "averages": avg,
        "risk_distribution": risk_dist,
        "deterioration_alert": deteriorating,
        "trends": trends,
        "time_range": {
            "from": ordered[0].get("recorded_at") if ordered else None,
            "to": ordered[-1].get("recorded_at") if ordered else None,
        },
    }


def _compute_averages(readings: List[Dict]) -> Dict[str, Optional[float]]:
    fields = ["heart_rate", "blood_pressure_systolic", "blood_pressure_diastolic", "temperature", "oxygen_saturation", "risk_score"]
    result = {}
    for field in fields:
        vals = [r[field] for r in readings if r.get(field) is not None]
        result[field] = round(sum(vals) / len(vals), 2) if vals else None
    return result


def _risk_distribution(readings: List[Dict]) -> Dict[str, int]:
    dist = {"Low": 0, "Moderate": 0, "High": 0}
    for r in readings:
        level = r.get("risk_level")
        if level in dist:
            dist[level] += 1
    return dist


def _detect_deterioration(readings: List[Dict]) -> bool:
    """
    Flag deterioration if the last 3 readings show a monotonic
    increase in risk score (each reading worse than the previous).
    """
    if len(readings) < 3:
        return False
    recent = readings[-3:]
    scores = [r.get("risk_score") for r in recent if r.get("risk_score") is not None]
    if len(scores) < 3:
        return False
    return scores[0] < scores[1] < scores[2]


def _compute_trends(readings: List[Dict]) -> Dict[str, str]:
    """Compare first half average vs second half average for each vital."""
    if len(readings) < 4:
        return {}

    mid = len(readings) // 2
    first_half = readings[:mid]
    second_half = readings[mid:]

    fields = ["heart_rate", "blood_pressure_systolic", "blood_pressure_diastolic", "temperature", "oxygen_saturation", "risk_score"]
    trends = {}

    for field in fields:
        v1 = [r[field] for r in first_half if r.get(field) is not None]
        v2 = [r[field] for r in second_half if r.get(field) is not None]
        if not v1 or not v2:
            continue
        avg1 = sum(v1) / len(v1)
        avg2 = sum(v2) / len(v2)
        delta = avg2 - avg1
        if abs(delta) < 0.02 * avg1:  # <2% change = stable
            trends[field] = "stable"
        elif delta > 0:
            trends[field] = "worsening"
        else:
            trends[field] = "improving"

    return trends