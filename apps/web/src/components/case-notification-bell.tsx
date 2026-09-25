"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatCaseTime } from "@/lib/demo-cases";
import { useDemoCases } from "./demo-cases-store";

export function CaseNotificationBell() {
  const { notifications, unseen, markSeen } = useDemoCases();
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!frame.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("mousedown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);
  const readOne = (id: string) => { try { markSeen([id]); } catch { /* The bell must not break the workspace on a stale notification id. */ } };
  return <div className="notif-frame" ref={frame}>
    <button className="notif-bell" type="button" aria-expanded={open} aria-label={unseen.length ? `Notifikasi, ${unseen.length} belum dibaca` : "Notifikasi"} title="Notifikasi" onClick={() => setOpen((current) => !current)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2.5h-15z" /><path d="M10 18.5a2 2 0 0 0 4 0" /></svg>
      {unseen.length ? <span className="notif-badge">{unseen.length > 9 ? "9+" : unseen.length}</span> : null}
    </button>
    {open ? <div className="notif-panel" role="region" aria-label="Daftar notifikasi">
      <header><strong>Notifikasi</strong><span>{unseen.length ? `${unseen.length} belum dibaca` : "Semua sudah dibaca"}</span></header>
      {unseen.length ? <ul>{unseen.slice(0, 6).map((item) => <li key={item.id}>
        <button type="button" onClick={() => readOne(item.id)}>
          <strong>{item.title}</strong>
          <span>{item.detail}</span>
          <em>{formatCaseTime(item.at)} WIB · klik untuk tandai dibaca</em>
        </button>
      </li>)}</ul> : <div className="notif-empty"><strong>Tidak ada notifikasi baru</strong><span>Perubahan status kasus akan muncul di sini.</span></div>}
      {notifications.length ? <footer>{unseen.length > 1 ? <button type="button" className="notif-read-all" onClick={() => markSeen(unseen.map((item) => item.id))}>Tandai semua dibaca</button> : null}<Link href="/ops/log">Buka log &amp; audit</Link></footer> : null}
    </div> : null}
  </div>;
}
