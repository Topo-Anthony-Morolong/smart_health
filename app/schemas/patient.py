from pydantic import BaseModel
from typing import Optional
from datetime import date


class PatientCreate(BaseModel):
    name: str
    date_of_birth: Optional[date] = None
    condition: str  # e.g. "Type 2 Diabetes", "Hypertension"
    doctor_name: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class PatientRead(BaseModel):
    id: str
    name: str
    date_of_birth: Optional[date] = None
    condition: str
    doctor_name: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    condition: Optional[str] = None
    doctor_name: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None