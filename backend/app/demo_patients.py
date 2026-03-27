"""In-memory demo queue for doctor UI (competition / empty DB)."""

from __future__ import annotations

from .schemas import ChatTurn, ChiefComplaint, FamilyItem, PainLocation, PatientRecord


def build_demo_records() -> list[PatientRecord]:
    return [
        PatientRecord(
            patient_id="DEMO-001",
            patient_name="Anna Müller",
            status="waiting",
            language="en",
            transcript="Sharp pain in my left knee for about three days; it gets worse when I walk or go downstairs.",
            pain_locations=[
                PainLocation(body_part="left_knee", pain_type="stabbing", severity=7, duration="3_days"),
            ],
            ai_conversation_log=[
                ChatTurn(role="patient", content="My left knee hurts a lot."),
                ChatTurn(role="ai", content="Is the pain mostly on the inner or outer side of the knee?"),
                ChatTurn(role="patient", content="More on the front, below the kneecap."),
                ChatTurn(role="ai", content="Any swelling or feeling of the knee giving way?"),
            ],
            past_medical_history=["Hypertension", "Seasonal asthma"],
            family_history=[
                FamilyItem(relation="father", condition="Type 2 diabetes"),
                FamilyItem(relation="mother", condition="Hypertension"),
            ],
            read_back_text=(
                "Summary for clinician: left anterior knee pain, sharp quality, ~3 days, "
                "worse with weight-bearing. Past: HTN, mild asthma. Family: father T2DM, mother HTN."
            ),
            doctor_notes="Demo case — EU pitch. Consider meniscal vs patellofemoral pattern; confirm ROM and effusion.",
            chief_complaint=ChiefComplaint(
                summary="Left knee sharp pain ×3 days, worse with walking",
                location=["left_knee"],
                quality="stabbing",
                severity=7,
                onset="3_days",
                aggravating=["walking", "stairs"],
                relieving=["rest"],
            ),
        ),
        PatientRecord(
            patient_id="DEMO-002",
            patient_name="Jean Dupont",
            status="in_progress",
            language="fr",
            transcript="Lower back ache for two weeks, dull and constant; worse when sitting at the desk.",
            pain_locations=[
                PainLocation(body_part="lower_back", pain_type="dull", severity=5, duration="2_weeks"),
            ],
            ai_conversation_log=[
                ChatTurn(role="patient", content="My lower back has been sore for weeks."),
                ChatTurn(role="ai", content="Does the pain travel down one leg or stay in the back?"),
                ChatTurn(role="patient", content="Mostly stays in the back, sometimes to the hip."),
            ],
            past_medical_history=["None reported"],
            family_history=[FamilyItem(relation="mother", condition="Osteoporosis")],
            read_back_text="Chronic dull low back pain, 2 weeks, desk-related aggravation; no clear radiculopathy in transcript.",
            doctor_notes="",
            chief_complaint=ChiefComplaint(
                summary="Low back dull pain ×2 weeks, worse with prolonged sitting",
                location=["lower_back"],
                quality="dull",
                severity=5,
                onset="2_weeks",
                aggravating=["sitting"],
                relieving=[],
            ),
        ),
        PatientRecord(
            patient_id="DEMO-003",
            patient_name="张演示",
            status="waiting",
            language="mandarin",
            transcript="胸口闷痛三天了，走路快一点就更难受，休息一下会好一点。",
            pain_locations=[
                PainLocation(body_part="chest", pain_type="dull", severity=6, duration="3_days"),
            ],
            ai_conversation_log=[
                ChatTurn(role="patient", content="胸口闷，有时候像针扎一下。"),
                ChatTurn(role="ai", content="闷的感觉是整天都有，还是一阵一阵的？"),
                ChatTurn(role="patient", content="活动多了更明显，静下来能好点。"),
            ],
            past_medical_history=["高脂血症"],
            family_history=[FamilyItem(relation="父亲", condition="冠心病")],
            read_back_text="胸闷、活动后加重约 3 天，伴偶发刺痛感；既往血脂偏高；父冠心病。",
            doctor_notes="前台演示用例：注意与心源性胸闷鉴别，可追问夜间阵发性、出汗等。",
            chief_complaint=ChiefComplaint(
                summary="胸闷伴活动后加重 ×3 天，偶发刺痛",
                location=["chest"],
                quality="dull",
                severity=6,
                onset="3_days",
                aggravating=["walking", "exertion"],
                relieving=["rest"],
            ),
        ),
    ]


def merge_demo_patients(patients: dict[str, PatientRecord]) -> None:
    """演示病例始终并入队列（按 ID 去重），便于医生端随时看到结构化摘要效果。"""
    for rec in build_demo_records():
        patients.setdefault(rec.patient_id, rec)
