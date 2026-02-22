"""
Shared fixtures for Smart Health test suite.

Supabase is mocked at the dependency level so tests run fully offline
without needing a real database connection.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_supabase


# ---------------------------------------------------------------------------
# Reusable sample data
# ---------------------------------------------------------------------------
PATIENT_ID = "test-patient-uuid-001"

SAMPLE_PATIENT = {
    "id": PATIENT_ID,
    "name": "Jane Doe",
    "date_of_birth": "1970-05-14",
    "condition": "Type 2 Diabetes",
    "doctor_name": "Dr. Smith",
    "phone": "+27801234567",
    "notes": None,
    "created_at": "2026-01-01T00:00:00+00:00",
}

SAMPLE_VITAL = {
    "id": "vital-uuid-001",
    "patient_id": PATIENT_ID,
    "cholesterol": 200.0,
    "hdl": 50.0,
    "age": 55,
    "weight": 85.0,
    "bp_systolic": 130.0,
    "bp_diastolic": 85.0,
    "glucose": 110.0,
    "bmi": 27.5,
    "risk_score": 0.45,
    "risk_level": "Moderate",
    "recorded_at": "2026-01-01T08:00:00+00:00",
}

SAMPLE_ALERT = {
    "id": "alert-uuid-001",
    "patient_id": PATIENT_ID,
    "vital_reading_id": "vital-uuid-001",
    "message": "Hypertensive crisis detected: BP 185/125 mmHg.",
    "severity": "Critical",
    "acknowledged": False,
    "created_at": "2026-01-01T08:00:00+00:00",
}


# ---------------------------------------------------------------------------
# Supabase mock factory
# ---------------------------------------------------------------------------
def make_supabase_mock(return_data=None):
    """Return a MagicMock that mimics the Supabase chained query API."""
    mock_db = MagicMock()
    mock_response = MagicMock()
    mock_response.data = return_data if return_data is not None else []

    # Chain: db.table(...).select/insert/update/delete/eq/order/limit/single -> .execute()
    chain = MagicMock()
    chain.execute.return_value = mock_response
    chain.select.return_value = chain
    chain.insert.return_value = chain
    chain.update.return_value = chain
    chain.delete.return_value = chain
    chain.eq.return_value = chain
    chain.order.return_value = chain
    chain.limit.return_value = chain
    chain.single.return_value = chain

    mock_db.table.return_value = chain
    return mock_db, mock_response


# ---------------------------------------------------------------------------
# Pytest fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_supabase_patient():
    """Override get_supabase to return a patient-focused mock."""
    mock_db, _ = make_supabase_mock([SAMPLE_PATIENT])
    app.dependency_overrides[get_supabase] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.clear()


@pytest.fixture
def mock_supabase_vital():
    """Override get_supabase to return a vitals-focused mock."""
    mock_db, _ = make_supabase_mock([SAMPLE_VITAL])
    app.dependency_overrides[get_supabase] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.clear()


@pytest.fixture
def mock_supabase_alert():
    """Override get_supabase to return an alert-focused mock."""
    mock_db, _ = make_supabase_mock([SAMPLE_ALERT])
    app.dependency_overrides[get_supabase] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.clear()


@pytest.fixture
def mock_supabase_empty():
    """Override get_supabase to return empty results (simulates 404 scenarios)."""
    mock_db, _ = make_supabase_mock([])
    app.dependency_overrides[get_supabase] = lambda: mock_db
    yield mock_db
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """Plain test client without any DB override (use alongside a mock_supabase_* fixture)."""
    return TestClient(app)
