"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lumi-warga-intro-done";
/** Total choreography length; each child staggers inside this budget. */
export const INTRO_MS = 1_600;

/**
 * First-visit intro reveal. Plays once per browser (sessionStorage), skips on
 * any key, tap, or the visible "Lewati" affordance, and collapses to no-op
 * under prefers-reduced-motion. The class on <html> drives the CSS timeline so
 * nothing animates after the budget elapses.
 */
export function IntroReveal() {
  const [state, setState] = useState<"pending" | "playing" | "done">("pending");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = (() => { try { return window.sessionStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; } })();
    if (reduced || seen) { document.documentElement.classList.remove("intro-play"); setState("done"); return; }
    setState("playing");
    document.documentElement.classList.add("intro-play");
    const timer = window.setTimeout(finish, INTRO_MS);
    const skip = () => finish();
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  const finish = () => {
    document.documentElement.classList.remove("intro-play");
    try { window.sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* session-only by design. */ }
    setState("done");
  };

  if (state !== "playing") return null;
  return <button type="button" className="intro-skip" onClick={finish}>Lewati intro</button>;
}
