"""Tests for /assistant/chat endpoint."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app
from tests.conftest import PATIENT_ID

MOCK_RESPONSE = {
    "topic": "Blood Pressure",
    "response": "High blood pressure requires lifestyle changes and possibly medication.",
    "disclaimer": "This is general health information, not medical advice.",
}


@pytest.fixture
def client():
    return TestClient(app)


class TestAssistantChat:
    def test_chat_returns_structured_response(self, client):
        with patch("app.api.routes.assistant.get_assistant_response", return_value=MOCK_RESPONSE):
            response = client.post(
                "/assistant/chat",
                json={"question": "What should I do if my blood pressure is high?"},
            )

        assert response.status_code == 200
        data = response.json()
        assert "topic" in data
        assert "response" in data
        assert "disclaimer" in data

    def test_chat_with_patient_context(self, client):
        with patch("app.api.routes.assistant.get_assistant_response", return_value=MOCK_RESPONSE):
            response = client.post(
                "/assistant/chat",
                json={
                    "question": "What does my risk score mean?",
                    "patient_id": PATIENT_ID,
                },
            )

        assert response.status_code == 200

    def test_chat_missing_question_returns_422(self, client):
        response = client.post("/assistant/chat", json={})
        assert response.status_code == 422

    def test_chat_empty_question(self, client):
        with patch("app.api.routes.assistant.get_assistant_response", return_value=MOCK_RESPONSE):
            response = client.post("/assistant/chat", json={"question": ""})

        # Empty string is still a valid string — expect the service to handle it
        assert response.status_code == 200


class TestHealthCheck:
    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
