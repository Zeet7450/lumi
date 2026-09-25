"use client";

import { useState } from "react";
import { caseActionLabel, caseStatusLabel, caseSteps, formatCaseTime, type CaseAction, type DemoCase } from "@/lib/demo-cases";
import { CaseReadouts } from "./case-readouts";
import { CaseStepper } from "./case-stepper";
import { useDemoCases } from "./demo-cases-store";

type KlhAction = { action: CaseAction; label: string; kind: "primary" | "secondary" | "danger"; note?: string };

function klhActions(value: DemoCase): KlhAction[] {
  const actions: KlhAction[] = [];
  if (value.klhReview === "REPORTED") actions.push({ action: "KLH_APPROVE", label: "Setujui broadcast nasional", kind: "primary", note: "Disetujui: broadcast nasional berjalan bersama Kominfo." });
  if (value.klhReview === "APPROVED") actions.push({ action: "KLH_ASSIST_DONE", label: "Bantuan KLH selesai", kind: "secondary", note: "KLH menyatakan sisi bantuannya selesai; penutupan tetap di DLH Provinsi." });
  return actions;
}

export function MonitoringBoard() {
  const { cases, run } = useDemoCases();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const monitored = cases.filter((item) => item.klhReview !== "NONE");
  const selected = monitored.find((item) => item.id === selectedId) ?? monitored[0];
  const perform = (action: CaseAction, note?: string) => {
    if (!selected) return;
    try { setError(""); run(note ? { type: "CASE_ACTION", caseId: selected.id, action, note } : { type: "CASE_ACTION", caseId: selected.id, action }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Tindakan ini tidak dapat dijalankan."); }
  };
  if (!monitored.length) return <section className="case-board">
    <header className="ops-header"><div><p className="eyebrow">Monitoring nasional · KLH</p><h1>Belum ada kasus terlaporkan</h1><p className="muted">Kasus masuk ke KLH hanya setelah DLH Provinsi melaporkannya untuk broadcast nasional, terpisah dari jalur penanganan BPBD.</p></div></header>
    <div className="workflow-empty"><strong>Belum ada laporan broadcast</strong><span>Tunggu DLH Provinsi melaporkan kasus ke KLH dari halaman Verifikasi & Tindakan.</span></div>
  </section>;
  const actions = klhActions(selected);
  return <section className="case-board">
    <header className="ops-header"><div><p className="eyebrow">Monitoring nasional · KLH</p><h1>Verifikasi final & wewenang penutupan</h1><p className="muted">KLH menerima laporan DLH Provinsi untuk broadcast nasional dan menandai bantuannya selesai. Penutupan kasus tetap di tangan DLH Provinsi.</p></div><span className="badge tier-verify">{monitored.length} kasus termonitor</span></header>
    <div className="case-layout">
      <nav className="case-list" aria-label="Daftar kasus termonitor">{monitored.map((item) => <button key={item.id} type="button" className={item.id === selected.id ? "is-selected" : ""} onClick={() => setSelectedId(item.id)}><strong>{item.source.classification}</strong><span>{item.source.region.name} · {item.source.region.province}</span><small>{caseStatusLabel(item.status)} · {item.klhReview === "APPROVED" ? "broadcast disetujui" : item.klhReview === "ASSIST_DONE" ? "bantuan selesai" : "menunggu persetujuan"}</small></button>)}</nav>
      <article className="case-detail">
        <header className="case-detail-head"><div><p className="eyebrow">{selected.id}</p><h2>{selected.source.classification}</h2><span>{selected.source.region.name} · {selected.source.region.province}</span></div><span className={`badge ${selected.klhReview === "ASSIST_DONE" ? "tier-monitor" : selected.klhReview === "APPROVED" ? "tier-verify" : "tier-high"}`}>{selected.klhReview === "APPROVED" ? "Broadcast disetujui" : selected.klhReview === "ASSIST_DONE" ? "Bantuan selesai" : "Menunggu persetujuan"}</span></header>
        <dl className="case-facts"><div><dt>AQI</dt><dd>{selected.source.observation.aqi}</dd></div><div><dt>PM2.5</dt><dd>{selected.source.observation.pm25} µg/m³</dd></div><div><dt>Angin</dt><dd>{selected.source.observation.wind}</dd></div><div><dt>Bantuan BNPB</dt><dd>{selected.bnpbStage === "HELPING" ? "Sedang membantu" : selected.bnpbStage === "HANDED_OVER" ? "Serah kembali selesai" : "Tidak ada"}</dd></div></dl>
        <CaseStepper steps={caseSteps(selected, "KLHK")}>
          {selected.status === "CLOSED" ? <p className="case-waiting">Kasus sudah ditutup {selected.closedBy}. Log tetap tersimpan permanen.</p> : actions.length ? actions.map((item) => <button key={item.action} className={`button ${item.kind === "primary" ? "" : item.kind === "danger" ? "case-danger" : "secondary"}`} type="button" onClick={() => perform(item.action, item.note)}>{item.label}</button>) : <p className="case-waiting">Tidak ada tindakan yang diperlukan saat ini.</p>}
        </CaseStepper>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <CaseReadouts value={selected} />
        <section className="workflow-history"><p className="eyebrow">Jejak tindakan kasus</p><ol>{selected.events.slice().reverse().map((event, index) => <li key={`${event.at}-${event.action}-${index}`}><strong>{caseActionLabel(event.action)}</strong><span>{event.actor} · {formatCaseTime(event.at)} WIB{event.note ? ` · ${event.note}` : ""}</span></li>)}</ol></section>
      </article>
    </div>
  </section>;
}
