from __future__ import annotations

import itertools
import threading

from .demo_patients import merge_demo_patients
from .schemas import ChiefComplaint, IntakeSubmit, PatientRecord

_lock = threading.Lock()
_patients: dict[str, PatientRecord] = {}
_id_seq = itertools.count(1)


def next_patient_id() -> str:
    with _lock:
        return f"P{next(_id_seq):05d}"


def upsert_patient(record: PatientRecord) -> PatientRecord:
    with _lock:
        _patients[record.patient_id] = record
    return record


def get_patient(pid: str) -> PatientRecord | None:
    with _lock:
        return _patients.get(pid)


def list_patients() -> list[PatientRecord]:
    with _lock:
        merge_demo_patients(_patients)
        return list(_patients.values())


def build_chief_complaint(payload: IntakeSubmit) -> ChiefComplaint:
    locs = [p.body_part for p in payload.pain_locations]
    severities = [p.severity for p in payload.pain_locations]
    top_sev = max(severities) if severities else None
    qualities = [p.pain_type for p in payload.pain_locations if p.pain_type]
    summary_parts: list[str] = []
    if payload.transcript.strip():
        summary_parts.append(payload.transcript.strip())
    elif locs:
        summary_parts.append(f"疼痛部位：{', '.join(locs)}")
    summary = "；".join(summary_parts) if summary_parts else "（患者未填写主诉文字）"
    return ChiefComplaint(
        summary=summary,
        location=locs,
        quality=qualities[0] if qualities else "",
        severity=top_sev,
        onset=next((p.duration for p in payload.pain_locations if p.duration), ""),
        aggravating=[],
        relieving=[],
    )
