from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_assistant import get_assistant_response

router = APIRouter(prefix="/assistant", tags=["Virtual Assistant"])


class ChatRequest(BaseModel):
    question: str
    patient_id: str | None = None  # optional context


class ChatResponse(BaseModel):
    topic: str
    response: str
    disclaimer: str


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """
    Submit a health question and receive structured guidance from the
    virtual health assistant. No external API required.
    """
    result = get_assistant_response(request.question)
    return result