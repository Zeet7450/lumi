/**
 * Single source of truth for the LUMI theme preference.
 *
 * The preference is mirrored in two places on purpose:
 * - `localStorage` keeps the choice for the current browser origin.
 * - a cookie keeps the choice across the demo apps, which run on different
 *   ports (`3000` ops, `3001` warga, `3002` simulator). Cookies ignore ports,
 *   so all three apps of the same host agree on one theme.
 *
 * The cookie is the preferred read because it survives the per-origin split;
 * `localStorage` remains the fallback when cookies are unavailable.
 */

export const THEME_PREFERENCE_KEY = "lumi-theme-preference";

/** Fired on the window whenever the resolved theme changes through this module. */
export const THEME_CHANGE_EVENT = "lumi-theme-change";

const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  return isThemePreference(value) ? value : "system";
}

function readThemeCookie(): ThemePreference | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_PREFERENCE_KEY}=([^;]*)`));
  return match && isThemePreference(match[1]) ? match[1] : null;
}

function readStoredPreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(THEME_PREFERENCE_KEY);
    return isThemePreference(stored) ? stored : null;
  } catch {
    // Privacy-restricted browsers can deny storage; the theme still applies for this session.
    return null;
  }
}

/** Read the active preference. Never throws, and never returns an unknown value. */
export function readThemePreference(): ThemePreference {
  return readThemeCookie() ?? readStoredPreference() ?? "system";
}

export function prefersDarkScheme(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return prefersDarkScheme() ? "dark" : "light";
}

/**
 * Apply a preference to `<html data-theme>` and notify listeners so every
 * theme control on the page stays consistent.
 */
export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (root.dataset.theme !== resolved) root.dataset.theme = resolved;
    root.dataset.themePreference = preference;
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }
  return resolved;
}

/**
 * Persist an explicit user choice. Only user actions should call this — never
 * a mount/hydration effect, or a page that cannot read the stored preference
 * would overwrite the real choice with its default.
 */
export function setThemePreference(preference: ThemePreference): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_PREFERENCE_KEY, preference);
  } catch {
    // The cookie below still carries the choice while storage is unavailable.
  }
  try {
    document.cookie = `${THEME_PREFERENCE_KEY}=${preference}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  } catch {
    // A blocked cookie only costs cross-app sync; this origin keeps its theme.
  }
  applyTheme(preference);
}

/**
 * Inline script for the document head. Runs before the first paint so the
 * correct token set is used immediately — without it the app paints the light
 * defaults and then flips to dark once React hydrates.
 */
export const themeBootstrapScript = `(function(){try{var n="${THEME_PREFERENCE_KEY}",v=null,m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));if(m&&(m[1]==="light"||m[1]==="dark"||m[1]==="system")){v=m[1]}if(!v){try{v=window.localStorage.getItem(n)}catch(e){v=null}}if(v!=="light"&&v!=="dark"&&v!=="system"){v="system"}var d=v==="dark"||(v==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.dataset.themePreference=v}catch(e){}})();`;
