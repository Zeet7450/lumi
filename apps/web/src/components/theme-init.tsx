"use client";

import { useEffect } from "react";
import { applyTheme, readThemePreference } from "@/lib/theme";

/**
 * Re-asserts the stored theme after hydration and keeps "system" in sync with
 * the OS. The first paint is already handled by `themeBootstrapScript` in the
 * document head, so this component never introduces a flash by itself.
 */
export function ThemeInit() {
  useEffect(() => {
    const preference = readThemePreference();
    applyTheme(preference);
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystem = () => applyTheme("system");
    media.addEventListener("change", applySystem);
    return () => media.removeEventListener("change", applySystem);
  }, []);
  return null;
}
