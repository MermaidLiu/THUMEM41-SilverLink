from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class PainLocation(BaseModel):
    body_part: str
    pain_type: str
    severity: int = Field(ge=1, le=10)
    duration: str = ""


class FamilyItem(BaseModel):
    relation: str
    condition: str


class ChiefComplaint(BaseModel):
    summary: str = ""
    location: list[str] = Field(default_factory=list)
    quality: str = ""
    severity: int | None = None
    onset: str = ""
    aggravating: list[str] = Field(default_factory=list)
    relieving: list[str] = Field(default_factory=list)


class ChatTurn(BaseModel):
    role: Literal["patient", "ai"]
    content: str


class IntakeSubmit(BaseModel):
    patient_name: str = ""
    language: str = "mandarin"
    transcript: str = ""
    pain_locations: list[PainLocation] = Field(default_factory=list)
    ai_conversation_log: list[ChatTurn] = Field(default_factory=list)
    past_medical_history: list[str] = Field(default_factory=list)
    family_history: list[FamilyItem] = Field(default_factory=list)
    read_back_text: str = ""


class PatientRecord(IntakeSubmit):
    patient_id: str
    status: Literal["waiting", "in_progress", "done"] = "waiting"
    doctor_notes: str = ""
    chief_complaint: ChiefComplaint | None = None


class ASRRequest(BaseModel):
    """P0 mock: optional hint text simulates what ASR would return."""

    simulated_text: str = ""


class FollowUpRequest(BaseModel):
    user_input: str = ""
    existing_symptoms: str = ""
    conversation_log: list[ChatTurn] = Field(default_factory=list)


class DoctorNotesPatch(BaseModel):
    doctor_notes: str = ""
