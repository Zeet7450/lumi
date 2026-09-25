"use client";

import { useState } from "react";
import { canCloseCase, caseActionLabel, caseSteps, type CaseAction, type CaseAgency, type DemoCase } from "@/lib/demo-cases";
import { CaseReadouts } from "./case-readouts";
import { CaseStepper } from "./case-stepper";
import { useDemoCases } from "./demo-cases-store";
import { useDemoScenario } from "./demo-scenario-store";

type FieldAction = { action: CaseAction; label: string; kind: "primary" | "secondary" | "danger"; owner: CaseAgency; note?: string };

/** Every button here advances the ladder exactly one rung; none of them can undo a decision. */
function fieldActions(value: DemoCase): FieldAction[] {
  const actions: FieldAction[] = [];
  if (value.status === "DETECTED") actions.push({ action: "BPBD_VERIFY", label: "Terverifikasi BPBD", kind: "primary", owner: "BPBD" }, { action: "BPBD_REJECT", label: "Tolak kasus", kind: "danger", owner: "BPBD", note: "Kasus ditolak: tidak sesuai kriteria BPBD Provinsi." });
  if (value.status === "BPBD_VERIFIED") actions.push({ action: "DLH_MONITOR", label: "Terima & pantau AQI", kind: "primary", owner: "DLH" });
  if (value.status === "DLH_MONITORING") actions.push({ action: "DISSEMINATE_INFO", label: "Sebar informasi warga (Diskominfo)", kind: "primary", owner: "DLH", note: "Informasi kasus disebar ke web warga dan notifikasi provider bersama Diskominfo." });
  if (value.status === "INFO_DISSEMINATED") {
    if (!value.bpbdDone) {
      actions.push({ action: "BPBD_COMPLETE", label: "Penanganan lapangan selesai", kind: "primary", owner: "BPBD", note: "Penanganan lapangan dinyatakan selesai oleh BPBD Provinsi." });
      if (value.bnpbStage !== "HELPING") actions.push({ action: "BPBD_REQUEST_HELP", label: "Minta bantuan BNPB", kind: "danger", owner: "BPBD", note: "Kapasitas BPBD Provinsi tidak cukup; bantuan BNPB diminta." });
    }
    if (value.bnpbStage === "HELPING") actions.push({ action: "BNPB_HANDOVER", label: "Serah kembali ke BPBD", kind: "primary", owner: "BNPB" });
    if (value.klhReview === "NONE") actions.push({ action: "DLH_REPORT_KLH", label: "Lapor KLH — broadcast nasional", kind: "secondary", owner: "DLH", note: "Laporan agar kawasan lain aware; bukan permintaan izin." });
    if (canCloseCase(value, "DLH")) actions.push({ action: "DLH_COMPLETE", label: "Tutup kasus dari DLH", kind: "primary", owner: "DLH", note: "DLH Provinsi menyatakan kasus benar-benar selesai." });
  }
  return actions;
}

/** Date + time of each verification moment, rendered under the timeline dot. */
function timelineLabel(iso: string): { date: string; time: string } {
  const at = new Date(iso);
  const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }).format(at);
  const time = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(at);
  return { date, time: `${time} WIB` };
}

function CaseTimeline({ value }: { value: DemoCase }) {
  const labels: Record<CaseAction, string> = {
    CREATE_CASE: "Kasus masuk",
    BPBD_VERIFY: "BPBD verifikasi",
    BPBD_REJECT: "BPBD tolak",
    DLH_MONITOR: "DLH pantau",
    DISSEMINATE_INFO: "Info warga tersebar",
    BPBD_COMPLETE: "BPBD selesai",
    BPBD_REQUEST_HELP: "Minta bantuan BNPB",
    BNPB_HANDOVER: "BNPB serah kembali",
    DLH_REPORT_KLH: "Lapor KLH",
    KLH_APPROVE: "KLH setujui",
    KLH_ASSIST_DONE: "KLH bantuan selesai",
    DLH_COMPLETE: "Kasus selesai"
  };
  return <div className="case-timeline" role="list" aria-label="Alur kasus dari kiri ke kanan">
    {value.events.map((event, index) => {
      const when = timelineLabel(event.at);
      return <div key={`${event.at}-${index}`} role="listitem" className={`case-timeline-step is-${event.action === "BPBD_REJECT" ? "failed" : value.status === "CLOSED" && index === value.events.length - 1 ? "final" : "done"}`}>
        <span className="case-timeline-date">{when.date}</span>
        <span className="case-timeline-dot" aria-hidden />
        <span className="case-timeline-time">{when.time}</span>
        <span className="case-timeline-label">{labels[event.action]}</span>
      </div>;
    })}
  </div>;
}

function CaseAccordionItem({ value, role, isOpen, onToggle, run }: { value: DemoCase; role: ReturnType<typeof useDemoScenario>["role"]; isOpen: boolean; onToggle: () => void; run: ReturnType<typeof useDemoCases>["run"] }) {
  const [error, setError] = useState("");
  const perform = (action: CaseAction, note?: string) => {
    try { setError(""); run(note ? { type: "CASE_ACTION", caseId: value.id, action, note } : { type: "CASE_ACTION", caseId: value.id, action }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Tindakan ini tidak dapat dijalankan."); }
  };
  const steps = caseSteps(value, "FIELD");
  const actions = fieldActions(value);
  const mine = actions.filter((item) => item.owner === role);
  const others = actions.filter((item) => item.owner !== role);
  return <article className={`case-accordion-item ${isOpen ? "is-open" : ""}`}>
    <button type="button" className="case-accordion-toggle" aria-expanded={isOpen} onClick={onToggle}>
      <span className="case-accordion-summary"><strong>{value.source.classification}</strong><small>{value.source.region.name} · {value.source.region.province}</small></span>
      <span className={`badge ${value.status === "CLOSED" ? "tier-monitor" : value.status === "BPBD_REJECTED" ? "tier-verify" : "tier-high"}`}>{caseStatusLabelSafe(value.status)}</span>
      <span className="case-accordion-chevron" aria-hidden>{isOpen ? "▾" : "▸"}</span>
    </button>
    {isOpen ? <div className="case-accordion-body">
      <header className="case-detail-head"><div><p className="eyebrow">{value.id}</p></div></header>
      <CaseTimeline value={value} />
      <dl className="case-facts"><div><dt>AQI</dt><dd>{value.source.observation.aqi}</dd></div><div><dt>PM2.5</dt><dd>{value.source.observation.pm25} µg/m³</dd></div><div><dt>Angin</dt><dd>{value.source.observation.wind}</dd></div><div><dt>Bantuan BNPB</dt><dd>{value.bnpbStage === "HELPING" ? "Sedang membantu" : value.bnpbStage === "HANDED_OVER" ? "Serah kembali selesai" : "Tidak ada"}</dd></div><div><dt>Broadcast KLH</dt><dd>{value.klhReview === "REPORTED" ? "Menunggu persetujuan" : value.klhReview === "APPROVED" ? "Disetujui" : value.klhReview === "ASSIST_DONE" ? "Bantuan selesai" : "Tidak ada"}</dd></div></dl>
      <CaseStepper steps={steps}>
        {mine.length ? mine.map((item) => <button key={item.action} className={`button ${item.kind === "primary" ? "" : item.kind === "danger" ? "case-danger" : "secondary"}`} type="button" onClick={() => perform(item.action, item.note)}>{item.label}</button>) : <p className="case-waiting">{others.length ? `Menunggu tindakan ${others[0]!.owner}. Keputusan hanya dapat diambil oleh instansi yang berwenang.` : value.status === "CLOSED" || value.status === "BPBD_REJECTED" ? "Alur kasus ini sudah berakhir." : "Tidak ada tindakan yang diperlukan dari peran ini."}</p>}
      </CaseStepper>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <CaseReadouts value={value} />
      <section className="workflow-history"><p className="eyebrow">Jejak tindakan kasus</p><ol>{value.events.slice().reverse().map((event, index) => <li key={`${event.at}-${event.action}-${index}`}><strong>{caseActionLabel(event.action)}</strong><span>{event.actor} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(event.at))} WIB{event.note ? ` · ${event.note}` : ""}</span></li>)}</ol></section>
    </div> : null}
  </article>;
}

function caseStatusLabelSafe(status: DemoCase["status"]): string {
  const map: Record<DemoCase["status"], string> = {
    DETECTED: "Menunggu verifikasi BPBD",
    BPBD_REJECTED: "Ditolak BPBD",
    BPBD_VERIFIED: "DLH memantau",
    DLH_MONITORING: "DLH memantau",
    INFO_DISSEMINATED: "Tindak lanjut",
    CLOSED: "Selesai"
  };
  return map[status];
}

export function CaseBoard() {
  const { role } = useDemoScenario();
  const { cases, run } = useDemoCases();
  const [openIds, setOpenIds] = useState<readonly string[]>([]);
  const toggle = (id: string) => setOpenIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const open = cases.filter((item) => item.status !== "CLOSED" && item.status !== "BPBD_REJECTED").length;
  if (!cases.length) return <section className="case-board">
    <header className="ops-header"><div><p className="eyebrow">Kasus provinsi · eskalasi nasional</p><h1>Belum ada kasus terdeteksi</h1><p className="muted">Kasus muncul otomatis setelah Simulator menjalankan skenario data uji di Simulation Center.</p></div></header>
    <div className="workflow-empty"><strong>Menunggu deteksi</strong><span>Setiap skenario yang dijalankan Simulator mengirim satu kasus ke BPBD Provinsi untuk diverifikasi.</span></div>
  </section>;
  return <section className="case-board">
    <header className="ops-header"><div><p className="eyebrow">Kasus provinsi · eskalasi nasional</p><h1>Verifikasi &amp; Tindakan</h1><p className="muted">Alur: kasus terdeteksi, BPBD verifikasi, DLH memantau lalu menyebar informasi warga bersama Diskominfo. Jalur BPBD-BNPB dan DLH-KLH berjalan paralel; penutupan akhir selalu oleh DLH Provinsi.</p></div><span className="badge tier-verify">{open} kasus aktif</span></header>
    <div className="case-accordion" aria-label="Daftar kasus">{cases.map((item) => <CaseAccordionItem key={item.id} value={item} role={role} isOpen={openIds.includes(item.id)} onToggle={() => toggle(item.id)} run={run} />)}</div>
  </section>;
}
