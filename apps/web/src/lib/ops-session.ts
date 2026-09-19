"use client";

import { useEffect, useState } from "react";
import { getOpsSession, type Actor } from "./lumi";

type Session = { actor: Actor; preview: boolean };
const key = "lumi-ops-preview-session";

export function useOpsSession() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const raw = window.sessionStorage.getItem(key);
    let saved: Session | null = null;
    try { if (raw) saved = JSON.parse(raw) as Session; }
    catch { window.sessionStorage.removeItem(key); }
    if (saved) setSession(saved);
    let cancelled = false;
    void getOpsSession().then((actor) => {
      if (cancelled) return;
      if (!actor) {
        // A server-backed session can disappear after a backend restart. Do
        // not leave the simulator looking signed in while every write is 401.
        if (saved && !saved.preview) {
          window.sessionStorage.removeItem(key);
          setSession(null);
        }
        return;
      }
      const next = { actor, preview: false };
      window.sessionStorage.setItem(key, JSON.stringify(next));
      setSession(next);
    });
    return () => { cancelled = true; };
  }, []);
  function save(next: Session) { window.sessionStorage.setItem(key, JSON.stringify(next)); setSession(next); }
  function clear() { window.sessionStorage.removeItem(key); setSession(null); }
  return { session, save, clear };
}
