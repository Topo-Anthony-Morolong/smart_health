"""Tests for /vitals endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.core.database import get_supabase
from tests.conftest import SAMPLE_VITAL, PATIENT_ID, make_supabase_mock

RISK_LOW = {"risk_score": 0.2, "risk_level": "Low", "recommendations": ["Keep it up!"]}
RISK_HIGH = {"risk_score": 0.85, "risk_level": "High", "recommendations": ["See a doctor."]}

VITAL_PAYLOAD = {
    "cholesterol": 200.0,
    "hdl": 50.0,
    "age": 55,
    "weight": 85.0,
    "bp_systolic": 130.0,
    "bp_diastolic": 85.0,
    "glucose": 110.0,
    "bmi": 27.5,
}

CRITICAL_VITAL_PAYLOAD = {
    **VITAL_PAYLOAD,
    "bp_systolic": 185.0,
    "bp_diastolic": 125.0,
    "glucose": 310.0,
}


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# POST /vitals/{patient_id}
# ---------------------------------------------------------------------------
class TestSubmitVitals:
    def test_submit_vitals_low_risk_no_alert(self, client):
        saved_vital = {**SAMPLE_VITAL, "risk_level": "Low", "risk_score": 0.2}
        mock_db, _ = make_supabase_mock([saved_vital])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        with patch("app.api.routes.vitals.calculate_risk", return_value=RISK_LOW), \
             patch("app.api.routes.vitals.create_alert_if_needed", return_value=None):
            response = client.post(f"/vitals/{PATIENT_ID}", json=VITAL_PAYLOAD)

        assert response.status_code == 201
        data = response.json()
        assert data["risk_level"] == "Low"
        assert data["alert_triggered"] is False

        app.dependency_overrides.clear()

    def test_submit_vitals_high_risk_triggers_alert(self, client):
        saved_vital = {**SAMPLE_VITAL, "risk_level": "High", "risk_score": 0.85}
        mock_db, _ = make_supabase_mock([saved_vital])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        mock_alert = {"id": "alert-001", "severity": "Critical"}

        with patch("app.api.routes.vitals.calculate_risk", return_value=RISK_HIGH), \
             patch("app.api.routes.vitals.create_alert_if_needed", return_value=mock_alert):
            response = client.post(f"/vitals/{PATIENT_ID}", json=CRITICAL_VITAL_PAYLOAD)

        assert response.status_code == 201
        data = response.json()
        assert data["alert_triggered"] is True

        app.dependency_overrides.clear()

    def test_submit_vitals_db_error_returns_500(self, client):
        mock_db = MagicMock()
        mock_db.table.return_value.insert.return_value.execute.side_effect = Exception("DB down")
        app.dependency_overrides[get_supabase] = lambda: mock_db

        with patch("app.api.routes.vitals.calculate_risk", return_value=RISK_LOW):
            response = client.post(f"/vitals/{PATIENT_ID}", json=VITAL_PAYLOAD)

        assert response.status_code == 500

        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# GET /vitals/{patient_id}
# ---------------------------------------------------------------------------
class TestGetVitalHistory:
    def test_get_vital_history_returns_list(self, client):
        mock_db, _ = make_supabase_mock([SAMPLE_VITAL])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get(f"/vitals/{PATIENT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert data[0]["patient_id"] == PATIENT_ID

        app.dependency_overrides.clear()

    def test_get_vital_history_empty(self, client):
        mock_db, _ = make_supabase_mock([])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get(f"/vitals/{PATIENT_ID}")
        assert response.status_code == 200
        assert response.json() == []

        app.dependency_overrides.clear()
