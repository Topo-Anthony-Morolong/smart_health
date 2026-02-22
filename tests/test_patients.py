"""Tests for /patients endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from app.main import app
from app.core.database import get_supabase
from tests.conftest import SAMPLE_PATIENT, PATIENT_ID, make_supabase_mock


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# POST /patients/
# ---------------------------------------------------------------------------
class TestCreatePatient:
    def test_create_patient_success(self, client):
        mock_db, _ = make_supabase_mock([SAMPLE_PATIENT])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        payload = {
            "name": "Jane Doe",
            "date_of_birth": "1970-05-14",
            "condition": "Type 2 Diabetes",
            "doctor_name": "Dr. Smith",
            "phone": "+27801234567",
        }
        response = client.post("/patients/", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Jane Doe"
        assert data["condition"] == "Type 2 Diabetes"
        assert "id" in data

        app.dependency_overrides.clear()

    def test_create_patient_db_error(self, client):
        mock_db = MagicMock()
        mock_db.table.return_value.insert.return_value.execute.side_effect = Exception("DB error")
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.post("/patients/", json={"name": "X", "condition": "Hypertension"})
        assert response.status_code == 400

        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# GET /patients/
# ---------------------------------------------------------------------------
class TestListPatients:
    def test_list_patients_returns_list(self, client):
        mock_db, _ = make_supabase_mock([SAMPLE_PATIENT])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get("/patients/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert response.json()[0]["id"] == PATIENT_ID

        app.dependency_overrides.clear()

    def test_list_patients_empty(self, client):
        mock_db, _ = make_supabase_mock([])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get("/patients/")
        assert response.status_code == 200
        assert response.json() == []

        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# GET /patients/{patient_id}
# ---------------------------------------------------------------------------
class TestGetPatient:
    def test_get_existing_patient(self, client):
        mock_db, _ = make_supabase_mock(SAMPLE_PATIENT)
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.get(f"/patients/{PATIENT_ID}")
        assert response.status_code == 200
        assert response.json()["id"] == PATIENT_ID

        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# PATCH /patients/{patient_id}
# ---------------------------------------------------------------------------
class TestUpdatePatient:
    def test_update_patient_success(self, client):
        updated = {**SAMPLE_PATIENT, "doctor_name": "Dr. Jones"}
        mock_db, _ = make_supabase_mock([updated])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.patch(f"/patients/{PATIENT_ID}", json={"doctor_name": "Dr. Jones"})
        assert response.status_code == 200
        assert response.json()["doctor_name"] == "Dr. Jones"

        app.dependency_overrides.clear()

    def test_update_patient_empty_body_returns_400(self, client):
        mock_db, _ = make_supabase_mock([SAMPLE_PATIENT])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.patch(f"/patients/{PATIENT_ID}", json={})
        assert response.status_code == 400

        app.dependency_overrides.clear()

    def test_update_patient_not_found(self, client):
        mock_db, _ = make_supabase_mock([])
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.patch(f"/patients/{PATIENT_ID}", json={"doctor_name": "Dr. X"})
        assert response.status_code == 404

        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# DELETE /patients/{patient_id}
# ---------------------------------------------------------------------------
class TestDeletePatient:
    def test_delete_patient_returns_204(self, client):
        mock_db = MagicMock()
        mock_db.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()
        app.dependency_overrides[get_supabase] = lambda: mock_db

        response = client.delete(f"/patients/{PATIENT_ID}")
        assert response.status_code == 204

        app.dependency_overrides.clear()
