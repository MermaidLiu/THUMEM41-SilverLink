export type LanguageMode = "mandarin" | "dialect";

export interface PainLocation {
  body_part: string;
  pain_type: string;
  severity: number;
  duration: string;
}

export interface FamilyItem {
  relation: string;
  condition: string;
}

export interface ChatTurn {
  role: "patient" | "ai";
  content: string;
}

export interface IntakeDraft {
  language: LanguageMode;
  transcript: string;
  pain_locations: PainLocation[];
  ai_conversation_log: ChatTurn[];
  past_medical_history: string[];
  family_history: FamilyItem[];
  patient_name: string;
  read_back_text: string;
}

const KEY = "silverlink_intake_draft_v1";

export const defaultDraft = (): IntakeDraft => ({
  language: "mandarin",
  transcript: "",
  pain_locations: [],
  ai_conversation_log: [],
  past_medical_history: [],
  family_history: [],
  patient_name: "",
  read_back_text: "",
});

export function loadDraft(): IntakeDraft {
  try {
    const raw = uni.getStorageSync(KEY) as string | IntakeDraft | undefined;
    if (!raw) return defaultDraft();
    if (typeof raw === "string") {
      const o = JSON.parse(raw) as IntakeDraft;
      return { ...defaultDraft(), ...o };
    }
    return { ...defaultDraft(), ...raw };
  } catch {
    return defaultDraft();
  }
}

export function saveDraft(d: IntakeDraft) {
  uni.setStorageSync(KEY, JSON.stringify(d));
}

export function clearDraft() {
  uni.removeStorageSync(KEY);
}
