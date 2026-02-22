from pydantic import BaseModel, Field
from typing import Optional, List


class VitalReading(BaseModel):
    """Input schema matching the actual Supabase 'vitals' table columns."""
    heart_rate: float = Field(..., description="Heart rate (bpm)", example=72.0)
    blood_pressure_systolic: float = Field(..., description="Systolic BP (mmHg)", example=140.0)
    blood_pressure_diastolic: float = Field(..., description="Diastolic BP (mmHg)", example=90.0)
    temperature: float = Field(..., description="Body temperature (°C)", example=37.0)
    oxygen_saturation: float = Field(..., description="SpO2 (%)", example=97.0)


class VitalReadingOut(BaseModel):
    """Output schema after a vital reading is processed."""
    id: str
    patient_id: str
    heart_rate: float
    blood_pressure_systolic: float
    blood_pressure_diastolic: float
    temperature: float
    oxygen_saturation: float
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    recommendations: List[str] = []
    alert_triggered: bool = False
    recorded_at: str


class VitalHistoryEntry(BaseModel):
    id: str
    patient_id: str
    heart_rate: Optional[float] = None
    blood_pressure_systolic: Optional[float] = None
    blood_pressure_diastolic: Optional[float] = None
    temperature: Optional[float] = None
    oxygen_saturation: Optional[float] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    recorded_at: Optional[str] = None