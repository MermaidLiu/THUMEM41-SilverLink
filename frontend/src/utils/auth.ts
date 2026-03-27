export type UserRole = "patient" | "doctor";

export interface AuthSession {
  username: string;
  displayName: string;
  role: UserRole;
}

const STORAGE_KEY = "silverlink_auth_v1";

/** 演示账号：用户名即身份；密码统一 123456 */
const ACCOUNTS: Record<string, { password: string; role: UserRole; displayName: string }> = {
  patient: { password: "123456", role: "patient", displayName: "演示患者" },
  doctor: { password: "123456", role: "doctor", displayName: "演示医生" },
  doc001: { password: "123456", role: "doctor", displayName: "张医生" },
  pat001: { password: "123456", role: "patient", displayName: "李女士" },
};

export function getAuth(): AuthSession | null {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY) as string | AuthSession | null;
    if (!raw) return null;
    if (typeof raw === "string") return JSON.parse(raw) as AuthSession;
    return raw;
  } catch {
    return null;
  }
}

export function setAuth(session: AuthSession) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuth() {
  uni.removeStorageSync(STORAGE_KEY);
}

export function tryLogin(username: string, password: string): AuthSession | null {
  const key = username.trim().toLowerCase();
  const row = ACCOUNTS[key];
  if (!row || row.password !== password) return null;
  return { username: key, displayName: row.displayName, role: row.role };
}

export function logout() {
  clearAuth();
  uni.reLaunch({ url: "/pages/login/login" });
}

export function ensurePatient(): boolean {
  const a = getAuth();
  if (!a || a.role !== "patient") {
    uni.reLaunch({ url: "/pages/login/login" });
    return false;
  }
  return true;
}

export function ensureDoctor(): boolean {
  const a = getAuth();
  if (!a || a.role !== "doctor") {
    uni.reLaunch({ url: "/pages/login/login" });
    return false;
  }
  return true;
}
