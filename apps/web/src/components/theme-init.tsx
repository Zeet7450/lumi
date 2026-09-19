"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => { const theme = window.localStorage.getItem("lumi-theme"); if (theme === "dark") document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme; }, []);
  return null;
}
