"""Tests for /analytics endpoint."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from app.core.database import get_supabase
from tests.conftest import SAMPLE_VITAL, PATIENT_ID, make_supabase_mock

MOCK_ANALYTICS = {
    "patient_id": PATIENT_ID,
    "total_readings": 5,
    "avg_bp_systolic": 132.0,
    "avg_bp_diastolic": 86.0,
    "avg_cholesterol": 205.0,
    "avg_risk_score": 0.42,
    "risk_distribution": {"Low": 2, "Moderate": 2, "High": 1},
    "trend": "stable",
    "deteriorating": False,
}


@pytest.fixture
def client():
    return TestClient(app)


class TestGetAnalytics:
    def test_analytics_returns_computed_data(self, client):
        mock_db, _ = make_supabase_mock([SAMPLE_VITAL] * 5)
        app.dependency_overrides[get_supabase] = lambda: mock_db

        with patch("app.api.routes.analytics.compute_analytics", return_value=MOCK_ANALYTICS):
            response = client.get(f"/analytics/{PATIENT_ID}")

        assert response.status_code == 200
        data = response.json()
        assert data["patient_id"] == PATIENT_ID
        assert "avg_risk_score" in data or "total_readings" in data

        app.dependency_overrides.clear()

    def test_analytics_empty_history(self, client):
        mock_db, _ = make_supabase_mock([])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        empty_analytics = {**MOCK_ANALYTICS, "total_readings": 0}
        with patch("app.api.routes.analytics.compute_analytics", return_value=empty_analytics):
            response = client.get(f"/analytics/{PATIENT_ID}")

        assert response.status_code == 200

        app.dependency_overrides.clear()

    def test_analytics_db_error_returns_500(self, client):
        from unittest.mock import MagicMock
        mock_db = MagicMock()
        mock_db.table.return_value.select.return_value.eq.return_value \
               .order.return_value.limit.return_value.execute.side_effect = Exception("DB error")
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get(f"/analytics/{PATIENT_ID}")
        assert response.status_code == 500

        app.dependency_overrides.clear()
