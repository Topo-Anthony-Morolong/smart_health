from pydantic import BaseModel
from typing import Optional


class AlertOut(BaseModel):
    id: str
    patient_id: str
    vital_reading_id: Optional[str] = None
    message: str
    severity: str   # "Warning" | "Critical"
    acknowledged: bool
    created_at: Optional[str] = None