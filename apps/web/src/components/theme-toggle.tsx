"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);
  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("lumi-theme", next ? "dark" : "light");
    setDark(next);
  }
  const label = dark ? "Gunakan tema terang" : "Gunakan tema gelap";
  return <button className="icon-button" type="button" onClick={toggle} aria-label={label} aria-pressed={dark} title={label}>
    {dark ? <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.7 15.1A8.5 8.5 0 0 1 8.9 3.3 8.5 8.5 0 1 0 20.7 15.1Z" /></svg>}
  </button>;
}
