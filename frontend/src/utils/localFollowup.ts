/** 后端 /api/ai/follow-up 不可用时，与 backend/app/ai_followup.py 规则对齐的本地追问 */

export type ChatTurn = { role: "patient" | "ai"; content: string };

const BODY_HINT =
  /头|胸|腹|背|腰|膝|腿|臂|手腕|肩|脖子|胃|肚子|脚|手肘|髋|臀|knee|back|chest|head|stomach|belly|shoulder|neck|leg|arm|foot|hip/i;

function extractSide(text: string) {
  return /(左|右)边|左侧|右侧|左膝|右膝/.test(text);
}

function extractDuration(text: string) {
  return /\d+\s*(天|周|月|小时)|多久|几天/.test(text);
}

function extractQuality(text: string) {
  return /针|刺|酸|胀|灼|隐痛|钝痛|像|感觉/.test(text);
}

function extractAggravate(text: string) {
  return /走路|活动|站|蹲|加重|更疼/.test(text);
}

export function shouldOpenBodyModelLocal(
  existingSymptoms: string,
  userInput: string,
  conversationLog: ChatTurn[]
): boolean {
  const es = existingSymptoms.trim();
  if (es && es !== "—" && es !== "-") return false;
  if (BODY_HINT.test(userInput.trim())) return false;
  const patientTurns = conversationLog.filter((m) => m.role === "patient").length;
  return patientTurns >= 1;
}

/** 返回 vue-i18n 键名（不含 patient.symptom. 前缀） */
export function localFollowUpMessageKey(userInput: string, existingSymptoms: string): string {
  const utter = userInput.trim();
  const ctx = `${existingSymptoms} ${utter}`;
  if (!utter) return "localFuEmpty";
  if (/膝|膝盖/.test(ctx) && !extractSide(ctx)) return "localFuKneeSide";
  if (!extractDuration(ctx)) return "localFuDuration";
  if (!extractQuality(ctx)) return "localFuQuality";
  if (!extractAggravate(ctx)) return "localFuAggravate";
  return "localFuOther";
}
