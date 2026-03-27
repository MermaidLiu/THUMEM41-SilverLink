import { createI18n } from "vue-i18n";
import messages from "./locales/messages";

const STORAGE_KEY = "silverlink_locale";
const CODES = ["zh", "en", "de", "fr", "es"] as const;

function readStoredLocale(): string {
  try {
    const s = uni.getStorageSync(STORAGE_KEY) as string;
    if (s && CODES.includes(s as (typeof CODES)[number])) return s;
  } catch {
    /* ignore */
  }
  return "zh";
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: readStoredLocale(),
  fallbackLocale: "en",
  messages: messages as Record<string, unknown>,
});

export function setAppLocale(code: string) {
  if (!CODES.includes(code as (typeof CODES)[number])) return;
  uni.setStorageSync(STORAGE_KEY, code);
  const loc = i18n.global.locale as unknown as { value: string };
  loc.value = code;
}

export function getAppLocale(): string {
  const loc = i18n.global.locale as unknown as { value: string };
  return loc.value;
}
