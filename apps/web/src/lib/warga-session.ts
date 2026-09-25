/**
 * Citizen account + session — shared by the landing page, /masuk, /daftar,
 * and the citizen dashboard. Login is email + password (product decision:
 * no phone, no OTP, no Google). Both live in localStorage, device-local by
 * design:
 *   - the account holds the credential (SHA-256 digest, never plaintext)
 *     and profile, and survives logout;
 *   - the session is just the logged-in marker with a 60-day expiry, so
 *     returning citizens do not re-login.
 */

export type WargaGender = "perempuan" | "laki-laki" | "lainnya";

export type WargaAccount = {
  email: string;
  passHash: string;
  gender: WargaGender;
  nickname: string;
  region: string;
};

const ACCOUNT_KEY = "lumi-warga-account";
const SESSION_KEY = "lumi-warga-session";
export const SESSION_DAYS = 60;
export const DEFAULT_REGION = "pontianak";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;

/**
 * Built-in demo citizen (product decision): exists on every device without
 * registering. Same SHA-256 storage as user-registered accounts.
 */
export const DEMO_ACCOUNT: WargaAccount = {
  email: "amelia.warga@demo.lumi.id",
  passHash: "9d473042e6c062eb6204cd5b428a1ed2eb194c81e0f1e0384f89fa52d44c718e",
  gender: "perempuan",
  nickname: "Amelia",
  region: "pontianak"
};

/** SHA-256 hex digest. A device-local gate, not server-side cryptography. */
export async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function readAccount(): WargaAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WargaAccount;
    if (!parsed.email || !parsed.passHash) { window.localStorage.removeItem(ACCOUNT_KEY); return null; }
    return { email: parsed.email, passHash: parsed.passHash, gender: parsed.gender ?? "lainnya", nickname: parsed.nickname ?? "", region: parsed.region || DEFAULT_REGION };
  } catch { return null; }
}

export function registerAccount(account: WargaAccount): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account)); } catch { /* device-local only. */ }
}

export type LoginResult = "ok" | "no-account" | "wrong-password";

export async function verifyLogin(email: string, password: string): Promise<LoginResult> {
  if (email === DEMO_ACCOUNT.email) return (await hashPassword(password)) === DEMO_ACCOUNT.passHash ? "ok" : "wrong-password";
  const account = readAccount();
  if (!account || account.email !== email) return "no-account";
  return (await hashPassword(password)) === account.passHash ? "ok" : "wrong-password";
}

/** Logged-in marker; points at the account, carries its own 60-day expiry. */
export function saveSession(email: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(SESSION_KEY, JSON.stringify({ email, exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1_000 })); } catch { /* device-local only. */ }
}

/** Profile of the active session, or null when logged out / expired. */
export function readSession(): WargaAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string; exp?: number };
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) { window.localStorage.removeItem(SESSION_KEY); return null; }
    if (parsed.email === DEMO_ACCOUNT.email) return DEMO_ACCOUNT;
    const account = readAccount();
    if (!account || account.email !== parsed.email) { window.localStorage.removeItem(SESSION_KEY); return null; }
    return account;
  } catch { return null; }
}

/** Logout: ends the session only — the account stays on the device. */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(SESSION_KEY); } catch { /* nothing to clean. */ }
}

export function dashboardPath(region?: string): string {
  return `/wilayah/${region || DEFAULT_REGION}`;
}
