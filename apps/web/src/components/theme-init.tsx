"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    const preference = window.localStorage.getItem("lumi-theme-preference") ?? "system";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { document.documentElement.dataset.theme = preference === "dark" || (preference === "system" && media.matches) ? "dark" : "light"; };
    apply();
    if (preference === "system") { media.addEventListener("change", apply); return () => media.removeEventListener("change", apply); }
  }, []);
  return null;
}
