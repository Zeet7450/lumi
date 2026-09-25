"use client";

import { useState } from "react";
import { caseActionLabel, caseStatusLabel, caseSteps, formatCaseTime, type DemoCase } from "@/lib/demo-cases";
import { CaseReadouts } from "./case-readouts";
import { CaseStepper } from "./case-stepper";
import { useDemoCases } from "./demo-cases-store";

export function NationalBoard() {
  const { cases, run } = useDemoCases();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const escalated = cases.filter((item) => item.bnpbStage !== "NONE");
  const selected = escalated.find((item) => item.id === selectedId) ?? escalated[0];
  const act = (value: DemoCase) => {
    try { setError(""); run({ type: "CASE_ACTION", caseId: value.id, action: "BNPB_HANDOVER", note: "BNPB selesai membantu; penanganan kembali penuh ke BPBD Provinsi." }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Tindakan ini tidak dapat dijalankan."); }
  };
  if (!escalated.length) return <section className="case-board">
    <header className="ops-header"><div><p className="eyebrow">Eskalasi nasional · BNPB</p><h1>Belum ada permintaan bantuan dari provinsi</h1><p className="muted">Kasus masuk ke BNPB hanya setelah BPBD Provinsi meminta bantuan kapasitas lapangan.</p></div></header>
    <div className="workflow-empty"><strong>Tidak ada permintaan bantuan</strong><span>Alur: kasus terdeteksi → BPBD verifikasi → DLH pantau & sebar info → BPBD butuh bantuan → BNPB.</span></div>
  </section>;
  const helping = selected.bnpbStage === "HELPING";
  return <section className="case-board">
    <header className="ops-header"><div><p className="eyebrow">Eskalasi nasional · BNPB</p><h1>Koordinasi lintas instansi</h1><p className="muted">BNPB membantu kapasitas lapangan BPBD Provinsi dan menyerahkan kembali saat selesai; jalur ini independen dari bantuan KLH.</p></div><span className="badge tier-high">{escalated.length} permintaan bantuan</span></header>
    <div className="case-layout">
      <nav className="case-list" aria-label="Daftar kasus eskalasi">{escalated.map((item) => <button key={item.id} type="button" className={item.id === selected.id ? "is-selected" : ""} onClick={() => setSelectedId(item.id)}><strong>{item.source.classification}</strong><span>{item.source.region.name} · {item.source.region.province}</span><small>{caseStatusLabel(item.status)} · {item.bnpbStage === "HELPING" ? "BNPB membantu" : "serah kembali selesai"}</small></button>)}</nav>
      <article className="case-detail">
        <header className="case-detail-head"><div><p className="eyebrow">{selected.id}</p><h2>{selected.source.classification}</h2><span>{selected.source.region.name} · {selected.source.region.province}</span></div><span className={`badge ${helping ? "tier-monitor" : "tier-high"}`}>{helping ? "BNPB membantu" : "Serah kembali selesai"}</span></header>
        <dl className="case-facts"><div><dt>AQI</dt><dd>{selected.source.observation.aqi}</dd></div><div><dt>PM2.5</dt><dd>{selected.source.observation.pm25} µg/m³</dd></div><div><dt>Angin</dt><dd>{selected.source.observation.wind}</dd></div><div><dt>Eskalasi</dt><dd>{formatCaseTime(selected.events.at(-1)!.at)}</dd></div></dl>
        <CaseStepper steps={caseSteps(selected, "BNPB")}>
          {helping ? <button className="button" type="button" onClick={() => act(selected)}>Selesai membantu — serah kembali ke BPBD</button> : <p className="case-waiting">Serah kembali sudah selesai; penutupan kasus tetap di tangan DLH Provinsi.</p>}
        </CaseStepper>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <CaseReadouts value={selected} />
        <section className="workflow-history"><p className="eyebrow">Jejak tindakan kasus</p><ol>{selected.events.slice().reverse().map((event, index) => <li key={`${event.at}-${event.action}-${index}`}><strong>{caseActionLabel(event.action)}</strong><span>{event.actor} · {formatCaseTime(event.at)} WIB{event.note ? ` · ${event.note}` : ""}</span></li>)}</ol></section>
      </article>
    </div>
  </section>;
}
