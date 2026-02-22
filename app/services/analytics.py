"""
Analytics service – computes vital trends and detects deterioration
patterns from historical readings stored in Supabase.
"""
from typing import Dict, Any, List, Optional
from loguru import logger


def compute_analytics(patient_id: str, readings: List[Dict]) -> Dict[str, Any]:
    """
    Given a list of vital readings (newest first), return averages,
    risk level distribution, deterioration flag, and trend direction.
    """
    empty_avgs: Dict[str, Optional[float]] = {
        "blood_pressure_systolic": None,
        "blood_pressure_diastolic": None,
        "heart_rate": None,
        "temperature": None,
        "oxygen_saturation": None,
        "risk_score": None,
    }

    if not readings:
        return {
            "patient_id": patient_id,
            "total_readings": 0,
            "risk_distribution": {"low": 0, "medium": 0, "high": 0},
            "averages": empty_avgs,
            "deteriorating": False,
            "trend_direction": "Insufficient data",
            "latest_risk_level": None,
        }

    # Reverse so oldest → newest for trend detection
    ordered = list(reversed(readings))

    return {
        "patient_id": patient_id,
        "total_readings": len(ordered),
        "risk_distribution": _risk_distribution(ordered),
        "averages": _compute_averages(ordered),
        "deteriorating": _detect_deterioration(ordered),
        "trend_direction": _compute_trend_direction(ordered),
        "latest_risk_level": ordered[-1].get("risk_level"),
    }


def _compute_averages(readings: List[Dict]) -> Dict[str, Optional[float]]:
    fields = [
        "heart_rate",
        "blood_pressure_systolic",
        "blood_pressure_diastolic",
        "temperature",
        "oxygen_saturation",
        "risk_score",
    ]
    result: Dict[str, Optional[float]] = {}
    for field in fields:
        vals = [r[field] for r in readings if r.get(field) is not None]
        result[field] = round(sum(vals) / len(vals), 2) if vals else None
    return result


def _risk_distribution(readings: List[Dict]) -> Dict[str, int]:
    dist: Dict[str, int] = {"low": 0, "medium": 0, "high": 0}
    for r in readings:
        level = r.get("risk_level")
        if level in dist:
            dist[level] += 1
    return dist


def _detect_deterioration(readings: List[Dict]) -> bool:
    """Flag deterioration if the last 3 readings show monotonically increasing risk scores."""
    if len(readings) < 3:
        return False
    recent = readings[-3:]
    scores = [r.get("risk_score") for r in recent if r.get("risk_score") is not None]
    if len(scores) < 3:
        return False
    return scores[0] < scores[1] < scores[2]


def _compute_trend_direction(readings: List[Dict]) -> str:
    """Compare first half vs second half average risk_score to determine direction."""
    if len(readings) < 4:
        return "Insufficient data"

    mid = len(readings) // 2
    first_scores = [r["risk_score"] for r in readings[:mid] if r.get("risk_score") is not None]
    second_scores = [r["risk_score"] for r in readings[mid:] if r.get("risk_score") is not None]

    if not first_scores or not second_scores:
        return "Insufficient data"

    avg1 = sum(first_scores) / len(first_scores)
    avg2 = sum(second_scores) / len(second_scores)
    delta = avg2 - avg1

    if delta < -0.05:
        return "Improving"
    if delta > 0.05:
        return "Worsening"
    return "Stable"
