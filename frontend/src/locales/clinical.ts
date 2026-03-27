/** Clinical option strings per UI locale (chips / pickers). */

export type LocaleCode = "zh" | "en" | "de" | "fr" | "es";

export const SUPPORTED_LOCALES: { code: LocaleCode; label: string }[] = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

const body: Record<LocaleCode, Record<string, string>> = {
  zh: {
    head: "头部",
    chest: "胸部",
    abdomen: "腹部",
    lower_back: "腰部 / 下背",
    left_shoulder: "左肩",
    right_shoulder: "右肩",
    left_knee: "左膝",
    right_knee: "右膝",
    left_ankle: "左踝",
    right_ankle: "右踝",
  },
  en: {
    head: "Head",
    chest: "Chest",
    abdomen: "Abdomen",
    lower_back: "Lower back",
    left_shoulder: "Left shoulder",
    right_shoulder: "Right shoulder",
    left_knee: "Left knee",
    right_knee: "Right knee",
    left_ankle: "Left ankle",
    right_ankle: "Right ankle",
  },
  de: {
    head: "Kopf",
    chest: "Brust",
    abdomen: "Bauch",
    lower_back: "Unterer Rücken",
    left_shoulder: "Linke Schulter",
    right_shoulder: "Rechte Schulter",
    left_knee: "Linkes Knie",
    right_knee: "Rechtes Knie",
    left_ankle: "Linker Knöchel",
    right_ankle: "Rechter Knöchel",
  },
  fr: {
    head: "Tête",
    chest: "Thorax",
    abdomen: "Abdomen",
    lower_back: "Bas du dos",
    left_shoulder: "Épaule gauche",
    right_shoulder: "Épaule droite",
    left_knee: "Genou gauche",
    right_knee: "Genou droit",
    left_ankle: "Cheville gauche",
    right_ankle: "Cheville droite",
  },
  es: {
    head: "Cabeza",
    chest: "Tórax",
    abdomen: "Abdomen",
    lower_back: "Zona lumbar",
    left_shoulder: "Hombro izquierdo",
    right_shoulder: "Hombro derecho",
    left_knee: "Rodilla izquierda",
    right_knee: "Rodilla derecha",
    left_ankle: "Tobillo izquierdo",
    right_ankle: "Tobillo derecho",
  },
};

const pain: Record<LocaleCode, Record<string, string>> = {
  zh: {
    stabbing: "刺痛",
    dull: "钝痛",
    burning: "灼烧感",
    distending: "胀痛",
    aching: "隐痛 / 酸胀",
  },
  en: {
    stabbing: "Stabbing",
    dull: "Dull ache",
    burning: "Burning",
    distending: "Pressure / tight",
    aching: "Aching",
  },
  de: {
    stabbing: "Stechend",
    dull: "Dumpf",
    burning: "Brennend",
    distending: "Drückend",
    aching: "Wie Muskelkater",
  },
  fr: {
    stabbing: "Piqûres",
    dull: "Douloureux, sourd",
    burning: "Brûlure",
    distending: "Distension",
    aching: "Courbatures",
  },
  es: {
    stabbing: "Punzante",
    dull: "Sordo",
    burning: "Urente",
    distending: "Distensivo",
    aching: "Agudo / tirante",
  },
};

const past: Record<LocaleCode, string[]> = {
  zh: [
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
  ],
  en: [
    "Hypertension",
    "Type 2 diabetes",
    "Coronary artery disease",
    "Stroke",
    "Chronic kidney disease",
    "Asthma / COPD",
    "Thyroid disease",
    "Cancer history",
    "Major surgery",
    "None of the above",
  ],
  de: [
    "Hypertonie",
    "Diabetes Typ 2",
    "Koronare Herzkrankheit",
    "Schlaganfall",
    "Chronische Nierenerkrankung",
    "Asthma / COPD",
    "Schilddrüsenerkrankung",
    "Tumor in der Vorgeschichte",
    "Großer Eingriff",
    "Keines der genannten",
  ],
  fr: [
    "Hypertension",
    "Diabète de type 2",
    "Maladie coronarienne",
    "AVC",
    "Insuffisance rénale chronique",
    "Asthme / BPCO",
    "Maladie thyroïdienne",
    "Antécédent de cancer",
    "Chirurgie majeure",
    "Aucun de ces éléments",
  ],
  es: [
    "Hipertensión",
    "Diabetes tipo 2",
    "Enfermedad coronaria",
    "Accidente cerebrovascular",
    "Enfermedad renal crónica",
    "Asma / EPOC",
    "Enfermedad tiroidea",
    "Antecedente oncológico",
    "Cirugía mayor",
    "Ninguno de los anteriores",
  ],
};

const familyRels: Record<LocaleCode, string[]> = {
  zh: ["父亲", "母亲", "兄弟姐妹", "子女", "祖父母"],
  en: ["Father", "Mother", "Sibling", "Child", "Grandparent"],
  de: ["Vater", "Mutter", "Geschwister", "Kind", "Großeltern"],
  fr: ["Père", "Mère", "Frère/sœur", "Enfant", "Grand-parent"],
  es: ["Padre", "Madre", "Hermano/a", "Hijo/a", "Abuelo/a"],
};

const familyCond: Record<LocaleCode, string[]> = {
  zh: ["高血压", "糖尿病", "冠心病", "肿瘤", "精神疾病", "其他"],
  en: ["Hypertension", "Diabetes", "Heart disease", "Cancer", "Mental health", "Other"],
  de: ["Hypertonie", "Diabetes", "Herzkrankheit", "Krebs", "Psychische Erkrankung", "Sonstiges"],
  fr: ["Hypertension", "Diabète", "Maladie cardiaque", "Cancer", "Santé mentale", "Autre"],
  es: ["Hipertensión", "Diabetes", "Cardiopatía", "Cáncer", "Salud mental", "Otro"],
};

export function getBodyLabel(locale: string, partId: string): string {
  const L = (locale as LocaleCode) in body ? (locale as LocaleCode) : "zh";
  return body[L][partId] ?? partId;
}

export function getPainLabel(locale: string, painId: string): string {
  const L = (locale as LocaleCode) in pain ? (locale as LocaleCode) : "zh";
  return pain[L][painId] ?? painId;
}

export function getPastOptions(locale: string): string[] {
  const L = (locale as LocaleCode) in past ? (locale as LocaleCode) : "zh";
  return past[L];
}

export function getFamilyRelations(locale: string): string[] {
  const L = (locale as LocaleCode) in familyRels ? (locale as LocaleCode) : "zh";
  return familyRels[L];
}

export function getFamilyConditions(locale: string): string[] {
  const L = (locale as LocaleCode) in familyCond ? (locale as LocaleCode) : "zh";
  return familyCond[L];
}

export function painTypeIds(): { id: string }[] {
  return [
    { id: "stabbing" },
    { id: "dull" },
    { id: "burning" },
    { id: "distending" },
    { id: "aching" },
  ];
}
