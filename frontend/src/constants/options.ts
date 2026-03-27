export const BODY_PARTS: { id: string; label: string }[] = [
  { id: "head", label: "头部" },
  { id: "chest", label: "胸部" },
  { id: "abdomen", label: "腹部" },
  { id: "lower_back", label: "腰部 / 下背" },
  { id: "left_shoulder", label: "左肩" },
  { id: "right_shoulder", label: "右肩" },
  { id: "left_knee", label: "左膝" },
  { id: "right_knee", label: "右膝" },
  { id: "left_ankle", label: "左踝" },
  { id: "right_ankle", label: "右踝" },
];

export function labelForBodyPart(id: string): string {
  return BODY_PARTS.find((b) => b.id === id)?.label ?? id;
}

export const PAIN_TYPES: { id: string; label: string }[] = [
  { id: "stabbing", label: "刺痛" },
  { id: "dull", label: "钝痛" },
  { id: "burning", label: "灼烧感" },
  { id: "distending", label: "胀痛" },
  { id: "aching", label: "隐痛 / 酸胀" },
];

export const PAST_OPTIONS = [
  "高血压",
  "2型糖尿病",
  "冠心病",
  "脑卒中",
  "慢性肾病",
  "哮喘 / COPD",
  "甲状腺疾病",
  "肿瘤病史",
  "手术史（重大）",
  "无上述情况",
];

export const FAMILY_RELATIONS = ["父亲", "母亲", "兄弟姐妹", "子女", "祖父母"];

export const FAMILY_CONDITIONS = ["高血压", "糖尿病", "冠心病", "肿瘤", "精神疾病", "其他"];
