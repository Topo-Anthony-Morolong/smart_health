from __future__ import annotations

import uuid
from datetime import datetime, timezone
from sqlalchemy import Float, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.alert import Alert


class Vital(Base):
    __tablename__ = "vitals"
    __table_args__ = (
        CheckConstraint(
            "risk_level IN ('low', 'medium', 'high', 'critical')",
            name="valid_risk_level",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False
    )
    heart_rate: Mapped[float] = mapped_column(Float, nullable=False)
    blood_pressure_systolic: Mapped[float] = mapped_column(Float, nullable=False)
    blood_pressure_diastolic: Mapped[float] = mapped_column(Float, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=False)
    oxygen_saturation: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    patient: Mapped["Patient"] = relationship("Patient", back_populates="vitals")
    alerts: Mapped[list["Alert"]] = relationship(
        "Alert", back_populates="vital", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "patient_id": str(self.patient_id),
            "heart_rate": self.heart_rate,
            "blood_pressure_systolic": self.blood_pressure_systolic,
            "blood_pressure_diastolic": self.blood_pressure_diastolic,
            "temperature": self.temperature,
            "oxygen_saturation": self.oxygen_saturation,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
        }
