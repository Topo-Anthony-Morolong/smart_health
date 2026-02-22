"""Tests for /alerts endpoints."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_supabase
from tests.conftest import SAMPLE_ALERT, PATIENT_ID, make_supabase_mock


@pytest.fixture
def client():
    return TestClient(app)


ALERT_ID = "alert-uuid-001"


# ---------------------------------------------------------------------------
# GET /alerts/{patient_id}
# ---------------------------------------------------------------------------
class TestGetPatientAlerts:
    def test_get_alerts_for_patient(self, client):
        mock_db, _ = make_supabase_mock([SAMPLE_ALERT])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get(f"/alerts/{PATIENT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert data[0]["patient_id"] == PATIENT_ID
        assert data[0]["severity"] == "Critical"

        app.dependency_overrides.clear()

    def test_get_alerts_empty(self, client):
        mock_db, _ = make_supabase_mock([])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get(f"/alerts/{PATIENT_ID}")
        assert response.status_code == 200
        assert response.json() == []

        app.dependency_overrides.clear()

    def test_get_unacknowledged_only(self, client):
        mock_db, _ = make_supabase_mock([SAMPLE_ALERT])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get(f"/alerts/{PATIENT_ID}?unacknowledged_only=true")
        assert response.status_code == 200

        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# PATCH /alerts/{alert_id}/acknowledge
# ---------------------------------------------------------------------------
class TestAcknowledgeAlert:
    def test_acknowledge_alert_success(self, client):
        acknowledged = {**SAMPLE_ALERT, "acknowledged": True}
        mock_db, _ = make_supabase_mock([acknowledged])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.patch(f"/alerts/{ALERT_ID}/acknowledge")
        assert response.status_code == 200
        assert response.json()["acknowledged"] is True

        app.dependency_overrides.clear()

    def test_acknowledge_alert_not_found(self, client):
        mock_db, _ = make_supabase_mock([])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.patch(f"/alerts/nonexistent-id/acknowledge")
        assert response.status_code == 404

        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# GET /alerts/
# ---------------------------------------------------------------------------
class TestGetAllAlerts:
    def test_get_all_alerts(self, client):
        mock_db, _ = make_supabase_mock([SAMPLE_ALERT])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get("/alerts/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

        app.dependency_overrides.clear()

    def test_get_all_alerts_with_limit(self, client):
        mock_db, _ = make_supabase_mock([SAMPLE_ALERT])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get("/alerts/?limit=5")
        assert response.status_code == 200

        app.dependency_overrides.clear()
