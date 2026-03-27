from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .ai_followup import followup_response
from .schemas import (
    ASRRequest,
    DoctorNotesPatch,
    FollowUpRequest,
    IntakeSubmit,
    PatientRecord,
)
from .store import build_chief_complaint, get_patient, list_patients, next_patient_id, upsert_patient

app = FastAPI(title="SilverLink AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/asr/transcribe")
async def asr_transcribe(body: ASRRequest) -> dict[str, str]:
    """P0 mock ASR: returns client-provided simulated text or a demo sentence."""
    text = body.simulated_text.strip()
    if not text:
        # 演示：不含具体部位，便于触发「语音引导 + 弹出身图点选」流程
        text = "我也说不清哪里最难受，就是这两天整个人都不舒服。"
    return {"text": text}


@app.post("/api/ai/follow-up")
async def ai_follow_up(body: FollowUpRequest) -> dict[str, str | bool]:
    return await followup_response(body)


@app.post("/api/intake/submit", response_model=PatientRecord)
def intake_submit(body: IntakeSubmit) -> PatientRecord:
    pid = next_patient_id()
    chief = build_chief_complaint(body)
    record = PatientRecord(
        **body.model_dump(),
        patient_id=pid,
        status="waiting",
        chief_complaint=chief,
    )
    return upsert_patient(record)


@app.get("/api/doctor/patients", response_model=list[PatientRecord])
def doctor_patients() -> list[PatientRecord]:
    return sorted(list_patients(), key=lambda p: p.patient_id, reverse=True)


@app.get("/api/doctor/patients/{patient_id}", response_model=PatientRecord)
def doctor_patient_detail(patient_id: str) -> PatientRecord:
    rec = get_patient(patient_id)
    if not rec:
        raise HTTPException(status_code=404, detail="patient not found")
    return rec


@app.patch("/api/doctor/patients/{patient_id}/notes", response_model=PatientRecord)
def doctor_patch_notes(patient_id: str, body: DoctorNotesPatch) -> PatientRecord:
    rec = get_patient(patient_id)
    if not rec:
        raise HTTPException(status_code=404, detail="patient not found")
    rec.doctor_notes = body.doctor_notes
    return upsert_patient(rec)
