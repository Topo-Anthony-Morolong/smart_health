from pydantic import BaseModel
from typing import Optional


class AlertOut(BaseModel):
    id: str
    patient_id: str
    vital_id: Optional[str] = None
    alert_type: Optional[str] = None
    message: str
    severity: str   # "low" | "medium" | "high" | "critical"
    is_acknowledged: bool
    created_at: Optional[str] = None