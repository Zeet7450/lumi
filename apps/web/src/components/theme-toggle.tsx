"use client";

import { useCallback, useEffect, useState } from "react";
import { readThemePreference, resolveTheme, setThemePreference, THEME_CHANGE_EVENT } from "@/lib/theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const sync = useCallback(() => { setDark(resolveTheme(readThemePreference()) === "dark"); }, []);
  useEffect(() => {
    sync();
    // Keep the button truthful when the theme changes elsewhere (settings panel
    // or another demo app on the same host).
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, sync);
  }, [sync]);
  function toggle() {
    // Resolve from the stored preference instead of trusting local state, which
    // can be stale when the theme was changed outside this button.
    const next = resolveTheme(readThemePreference()) === "dark" ? "light" : "dark";
    setThemePreference(next);
    setDark(next === "dark");
  }
  const label = dark ? "Gunakan tema terang" : "Gunakan tema gelap";
  return <button className="icon-button" type="button" onClick={toggle} aria-label={label} aria-pressed={dark} title={label}>
    {dark ? <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.7 15.1A8.5 8.5 0 0 1 8.9 3.3 8.5 8.5 0 1 0 20.7 15.1Z" /></svg>}
  </button>;
}
