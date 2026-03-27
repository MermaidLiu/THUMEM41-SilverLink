import type { PainLocation } from "@/utils/intake";

/** 从口语里轻量抽取性质与程度，供语音主导流程使用 */
export function refineLastPainFromSpeech(last: PainLocation, text: string): PainLocation {
  const t = text.trim();
  let pain_type = last.pain_type;
  if (/刺|针扎|针扎样/.test(t)) pain_type = "stabbing";
  else if (/灼|烧|火辣/.test(t)) pain_type = "burning";
  else if (/胀|发胀/.test(t)) pain_type = "distending";
  else if (/酸|酸胀/.test(t)) pain_type = "aching";
  else if (/闷|钝|隐隐|压痛/.test(t)) pain_type = "dull";

  let severity = last.severity;
  const m1 = t.match(/(\d{1,2})\s*(分|级|成|档|个点)/);
  if (m1) {
    const n = parseInt(m1[1], 10);
    if (n >= 1 && n <= 10) severity = n;
  }
  const m2 = t.match(/^(?:疼|痛)?(?:到|有)?(\d{1,2})(?:分|级)?$/);
  if (m2) {
    const n = parseInt(m2[1], 10);
    if (n >= 1 && n <= 10) severity = n;
  }

  let duration = last.duration;
  const m3 = t.match(/(\d+)\s*(天|周|月|小时)/);
  if (m3) {
    const unit = m3[2] === "天" ? "days" : m3[2] === "周" ? "weeks" : m3[2] === "月" ? "months" : "hours";
    duration = `${m3[1]}_${unit}`;
  }

  return { ...last, pain_type, severity, duration };
}
