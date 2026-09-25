"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Stage = "closed" | "open" | "leaving";

/**
 * Themed logout confirmation. Replaces window.confirm with a modal built on
 * the same tokens as the rest of the shell. `variant` picks the palette:
 * the citizen side uses --warga-*, ops keeps its own --surface/--line set.
 * Logout itself happens only after "Ya, keluar", so cancel is a real cancel.
 */
export function LogoutModal({
  variant,
  logout,
  triggerClassName,
  triggerLabel = "Keluar",
  disabled,
  message = "Sesi Anda di perangkat ini akan diakhiri. Akun dan data profil tetap tersimpan."
}: {
  variant: "ops" | "warga";
  logout: () => void;
  triggerClassName: string;
  triggerLabel?: string;
  disabled?: boolean;
  message?: string;
}) {
  const [stage, setStage] = useState<Stage>("closed");
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (stage !== "open") return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setStage("closed"); };
    window.addEventListener("keydown", onKey);
    dialogRef.current?.querySelector<HTMLButtonElement>("button[data-logout]")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);

  const confirm = () => {
    setStage("leaving");
    logout();
  };

  return <>
    <button type="button" className={triggerClassName} onClick={() => setStage("open")} disabled={disabled}>{triggerLabel}</button>
    {/* Portal to body: triggers live in sidebars that collapse to display:none
        on phones, and the modal must survive that. */}
    {stage === "closed" || !mounted ? null : createPortal(<div className={`logout-overlay logout-${variant}`} role="presentation">
      <div className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-modal-title" ref={dialogRef}>
        <p className="logout-modal-eyebrow" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></svg>KELUAR</p>
        <h2 id="logout-modal-title">Akhiri sesi ini?</h2>
        <p>{message}</p>
        <div className="logout-modal-actions">
          <button type="button" className="logout-cancel" onClick={() => setStage("closed")}>Batal</button>
          <button type="button" className="logout-confirm" data-logout onClick={confirm}>Ya, keluar</button>
        </div>
      </div>
    </div>, document.body)}
  </>;
}
