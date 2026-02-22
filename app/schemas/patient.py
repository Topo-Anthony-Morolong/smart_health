from pydantic import BaseModel
from typing import Optional


class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str             # 'male' | 'female' | 'other'
    contact: Optional[str] = None
    medical_history: Optional[str] = None


class PatientRead(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    contact: Optional[str] = None
    medical_history: Optional[str] = None
    created_at: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    contact: Optional[str] = None
    medical_history: Optional[str] = None