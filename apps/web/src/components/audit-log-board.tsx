"use client";

import { useEffect, useState } from "react";
import { auditTrail, caseActionLabel, formatCaseTime, type CaseAuditEntry } from "@/lib/demo-cases";
import { useDemoCases } from "./demo-cases-store";
import { useDemoScenario } from "./demo-scenario-store";

function elapsedLabel(since: string, now: number): string {
  const minutes = Math.max(0, Math.round((now - new Date(since).valueOf()) / 60_000));
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} jam ${minutes % 60} menit` : `${Math.floor(hours / 24)} hari ${hours % 24} jam`;
}

/**
 * Waiting too long before an agency responds is the accountability failure this
 * page exists to expose, so the threshold is deliberately conservative: an open
 * case untouched for over an hour reads red even though the demo clock has
 * only just started.
 */
const WAIT_RED_MS = 60 * 60_000;
const WAIT_YELLOW_MS = 15 * 60_000;

type Severity = "done" | "waiting" | "late";

function severityTone(severity: Severity): { label: string; className: string } {
  if (severity === "late") return { label: "Menunggu terlalu lama", className: "log-sev-late" };
  if (severity === "waiting") return { label: "Menunggu respons", className: "log-sev-waiting" };
  return { label: "Sudah direspons", className: "log-sev-done" };
}

/**
 * The audit log is append-only by construction: nothing in the app can delete a
 * case or an event, so this page is the permanent record — including the
 * agencies that have not responded yet.
 */
export function AuditLogBoard() {
  const { role } = useDemoScenario();
  const { state, notifications, unseen, pending } = useDemoCases();
  const [now, setNow] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => { setNow(Date.now()); const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  const trail = auditTrail(state);
  const history = notifications.filter((item) => item.seen);

  const severityFor = (entry: CaseAuditEntry): Severity => {
    // Entry ids are `${caseId}:${index}`, but the case id itself is an ISO
    // timestamp full of colons — split on the LAST colon only.
    const caseId = entry.id.slice(0, entry.id.lastIndexOf(":"));
    const rawIndex = entry.id.slice(entry.id.lastIndexOf(":") + 1);
    const waits = pending.filter((item) => item.caseId === caseId);
    if (!waits.length) return "done";
    const events = state.cases.find((item) => item.id === caseId)?.events ?? [];
    if (events.length - 1 !== Number(rawIndex)) return "done";
    if (now !== null && now - new Date(entry.at).valueOf() > WAIT_RED_MS) return "late";
    return "waiting";
  };

  const pendingSeverity = (since: string): Severity => {
    if (now !== null && now - new Date(since).valueOf() > WAIT_RED_MS) return "late";
    return "waiting";
  };

  const myTrail = trail.filter((entry) => entry.actor === role);

  return <section className="case-board">
    <header className="ops-header"><div><p className="eyebrow">Log &amp; audit permanen</p><h1>Jejak akuntabilitas lintas instansi</h1><p className="muted">Semua perubahan status kasus tercatat permanen dan tidak dapat dihapus dari aplikasi. Tampilan di bawah menyoroti jejak akun Anda ({role}); jejak instansi lain tetap terbaca sebagai konteks.</p></div><span className="badge tier-monitor">{trail.length} catatan audit · {myTrail.length} milik Anda</span></header>

    <section className="command-panel log-panel">
      <div className="panel-head"><div><p className="eyebrow">Akuntabilitas</p><h2>Menunggu respons</h2></div><span className="badge tier-verify">{pending.length} menunggu</span></div>
      {pending.length ? (
        <ol className="log-timeline">
          {pending.map((item) => {
            const tone = severityTone(pendingSeverity(item.since));
            return <li key={`${item.caseId}-${item.agency}`} className="log-entry">
              <span className={`log-severity ${tone.className}`}>{tone.label}</span>
              <div className="log-entry-body">
                <div className="log-entry-head"><strong>{item.agency}</strong><span className="log-entry-where">{item.label}</span></div>
                <div className="log-entry-meta">Kasus {item.caseId} · menunggu {now === null ? "—" : elapsedLabel(item.since, now)}</div>
              </div>
            </li>;
          })}
        </ol>
      ) : <p className="muted">Semua kasus aktif sudah ditindaklanjuti.</p>}
    </section>

    <section className="command-panel log-panel">
      <div className="panel-head"><div><p className="eyebrow">Notifikasi peran {role}</p><h2>Riwayat notifikasi terlacak</h2></div><span className="badge">{unseen.length} belum dibaca</span></div>
      {history.length ? (
        <ol className="log-timeline">
          {history.map((item) => <li key={item.id} className="log-entry">
            <span className="log-severity log-sev-done">Sudah dibaca</span>
            <div className="log-entry-body">
              <div className="log-entry-head"><strong>{item.title}</strong></div>
              <div className="log-entry-meta">{item.detail}</div>
              <div className="log-entry-meta log-entry-subtle">{formatCaseTime(item.at)} WIB · {item.caseId}</div>
            </div>
          </li>)}
        </ol>
      ) : <p className="muted">Belum ada notifikasi yang dibaca pada peran ini.</p>}
    </section>

    <section className="command-panel log-panel">
      <div className="panel-head"><div><p className="eyebrow">Audit trail lengkap</p><h2>Semua aksi tiap akun</h2></div></div>
      {trail.length ? (
        <ol className="log-timeline">
          {trail.map((entry) => {
            const mine = entry.actor === role;
            const tone = severityTone(severityFor(entry));
            const open = expanded === entry.id;
            const caseId = entry.id.slice(0, entry.id.lastIndexOf(":"));
            return <li key={entry.id} className={`log-entry log-expandable${mine ? " is-mine" : ""}${open ? " is-open" : ""}`}>
              <button type="button" className="log-entry-toggle" aria-expanded={open} onClick={() => setExpanded(open ? null : entry.id)}>
                <span className={`log-severity ${tone.className}`}>{tone.label}</span>
                <span className="log-entry-body">
                  <span className="log-entry-head"><strong>{caseActionLabel(entry.action)}</strong><span className="log-entry-where">{entry.actor}</span></span>
                  <span className="log-entry-meta">{formatCaseTime(entry.at)} WIB · Kasus {caseId.replace("kasus-", "")}</span>
                </span>
                <span className="log-caret" aria-hidden="true">{open ? "−" : "+"}</span>
              </button>
              {open ? <div className="log-entry-detail">
                <dl>
                  <div><dt>Waktu</dt><dd>{formatCaseTime(entry.at)} WIB</dd></div>
                  <div><dt>Aktor</dt><dd>{entry.actor}</dd></div>
                  <div><dt>Kasus</dt><dd>{caseId}</dd></div>
                  <div><dt>Aksi</dt><dd>{entry.action}</dd></div>
                  <div><dt>Catatan</dt><dd>{entry.detail || "—"}</dd></div>
                </dl>
              </div> : null}
            </li>;
          })}
        </ol>
      ) : <p className="muted">Belum ada aksi kasus yang tercatat.</p>}
    </section>
  </section>;
}
