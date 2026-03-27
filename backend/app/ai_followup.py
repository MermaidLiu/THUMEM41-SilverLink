from __future__ import annotations

import os
import re

import httpx

from .schemas import FollowUpRequest

SYSTEM_HINT = """你是一个医疗问诊助手。患者正在描述他的症状。请根据以下规则进行追问：
1. 每次只问一个问题
2. 追问内容围绕：症状部位、性质、持续时间、加重/缓解因素
3. 如果患者已回答过某个信息，不要再重复追问
4. 语气温和、非专业、易懂
请只输出一个问题，不要解释。"""


def _extract_side(text: str) -> bool:
    return bool(re.search(r"(左|右)边|左侧|右侧|左膝|右膝", text))


def _extract_duration(text: str) -> bool:
    return bool(re.search(r"\d+\s*(天|周|月|小时)|多久|几天", text))


def _extract_quality(text: str) -> bool:
    return bool(
        re.search(r"针|刺|酸|胀|灼|隐痛|钝痛|像|感觉", text)
    )


def _extract_aggravate(text: str) -> bool:
    return bool(re.search(r"走路|活动|站|蹲|加重|更疼", text))


# 若用户已提到具体部位，则不必弹出身图
_BODY_HINT = re.compile(
    r"头|胸|腹|背|腰|膝|腿|臂|手腕|肩|脖子|胃|肚子|脚|手肘|髋|臀|"
    r"knee|back|chest|head|stomach|belly|shoulder|neck|leg|arm|foot|hip"
)


def should_open_body_model(req: FollowUpRequest) -> bool:
    """尚无结构化部位、且用户口述里也未出现明确部位时，建议弹出身图点选。"""
    es = (req.existing_symptoms or "").strip()
    if es and es not in ("—", "-", ""):
        return False
    utter = (req.user_input or "").strip()
    if _BODY_HINT.search(utter):
        return False
    patient_turns = sum(1 for m in req.conversation_log if m.role == "patient")
    return patient_turns >= 1


def rule_based_question(req: FollowUpRequest) -> str:
    t = (req.user_input or "").strip()
    ctx = (req.existing_symptoms or "") + " " + t
    if not t:
        return "能用自己的话简单说说，哪里最不舒服吗？"
    if re.search(r"膝|膝盖", ctx) and not _extract_side(ctx):
        return "是左边还是右边膝盖疼呢？"
    if not _extract_duration(ctx):
        return "这种不舒服大概持续多久了？"
    if not _extract_quality(ctx):
        return "疼起来更像针扎一样的刺痛，还是酸胀、闷闷的感觉呢？"
    if not _extract_aggravate(ctx):
        return "做什么事情的时候会更难受一些？休息后会不会好一点？"
    return "还有没有其他部位也同时不舒服？"


async def llm_followup(req: FollowUpRequest) -> str | None:
    key = os.getenv("OPENAI_API_KEY")
    base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    if not key:
        return None
    log_lines = []
    for m in req.conversation_log[-8:]:
        who = "患者" if m.role == "patient" else "助手"
        log_lines.append(f"{who}：{m.content}")
    log_block = "\n".join(log_lines) if log_lines else "（尚无对话）"
    user_block = f"患者当前输入：{req.user_input}\n已有信息：{req.existing_symptoms}\n近期对话：\n{log_block}\n请生成下一个追问问题（一句话）。"
    url = base.rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {key}"}
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_HINT},
            {"role": "user", "content": user_block},
        ],
        "temperature": 0.4,
        "max_tokens": 120,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()
        return data["choices"][0]["message"]["content"].strip()


async def next_followup(req: FollowUpRequest) -> str:
    try:
        out = await llm_followup(req)
        if out:
            return out
    except Exception:
        pass
    return rule_based_question(req)


async def followup_response(req: FollowUpRequest) -> dict[str, str | bool]:
    """追问文案 + 是否在前端弹出身图（由界面用语音文案配合展示）。"""
    question = await next_followup(req)
    open_body = should_open_body_model(req)
    return {"question": question, "open_body_model": open_body}
