from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, Text, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING, Optional
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.vital import Vital
    from app.models.alert import Alert


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # New patient-profile fields
    condition:    Mapped[Optional[str]]  = mapped_column(String(255), nullable=True)
    doctor_name:  Mapped[Optional[str]]  = mapped_column(String(255), nullable=True)
    phone:        Mapped[Optional[str]]  = mapped_column(String(50),  nullable=True)
    notes:        Mapped[Optional[str]]  = mapped_column(Text,        nullable=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date,       nullable=True)

    # Legacy fields kept for backwards compatibility with existing rows
    contact:         Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    medical_history: Mapped[Optional[str]] = mapped_column(Text,        nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    vitals: Mapped[list["Vital"]] = relationship(
        "Vital", back_populates="patient", cascade="all, delete-orphan"
    )
    alerts: Mapped[list["Alert"]] = relationship(
        "Alert", back_populates="patient", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "condition": self.condition,
            "doctor_name": self.doctor_name,
            "phone": self.phone,
            "notes": self.notes,
            "date_of_birth": str(self.date_of_birth) if self.date_of_birth else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
