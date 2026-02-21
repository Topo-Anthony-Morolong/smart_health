from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class VitalReading(BaseModel):
    """Input schema for a patient vital reading submission."""
    cholesterol: float = Field(..., description="Total cholesterol (mg/dL)", example=200.0)
    hdl: float = Field(..., description="HDL cholesterol (mg/dL)", example=50.0)
    age: int = Field(..., description="Patient age in years", example=55)
    weight: float = Field(..., description="Weight in kg", example=85.0)
    bp_systolic: float = Field(..., description="Systolic blood pressure (mmHg)", example=140.0)
    bp_diastolic: float = Field(..., description="Diastolic blood pressure (mmHg)", example=90.0)
    # Optional extra context fields (stored but not used by ML model)
    glucose: Optional[float] = Field(None, description="Blood glucose (mg/dL)", example=140.0)
    bmi: Optional[float] = Field(None, description="Body Mass Index", example=27.5)


class VitalReadingOut(BaseModel):
    """Output schema after a vital reading is processed."""
    id: str
    patient_id: str
    cholesterol: float
    hdl: float
    age: int
    weight: float
    bp_systolic: float
    bp_diastolic: float
    glucose: Optional[float] = None
    bmi: Optional[float] = None
    risk_score: float
    risk_level: str  # "Low" | "Moderate" | "High"
    recommendations: List[str]
    alert_triggered: bool
    recorded_at: str


class VitalHistoryEntry(BaseModel):
    id: str
    patient_id: str
    cholesterol: Optional[float] = None
    hdl: Optional[float] = None
    bp_systolic: Optional[float] = None
    bp_diastolic: Optional[float] = None
    weight: Optional[float] = None
    glucose: Optional[float] = None
    bmi: Optional[float] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    recorded_at: Optional[str] = None