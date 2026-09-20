"use client";

import { useState } from "react";
import { useDemoScenario } from "./demo-scenario-store";
import { DemoScenarioMap } from "./demo-scenario-map";

export function IncidentsBoard() {
  const { scenario, role, run } = useDemoScenario();
  const [error, setError] = useState("");
  const perform = (type: "VALIDATE_ENVIRONMENT" | "VERIFY_INCIDENT" | "RECORD_RESPONSE") => {
    try { setError(""); run({ type }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Tindakan demo tidak dapat dijalankan."); }
  };
  const readyForDlh = scenario.workflow === "ENVIRONMENT_PENDING";
  const readyForVerify = scenario.workflow === "ENVIRONMENT_VALIDATED";
  const readyForResponse = scenario.workflow === "INCIDENT_VERIFIED";
  return <section className="workflow-board">
    <header className="ops-header"><div><p className="eyebrow">Antrean keputusan · {scenario.region.province}</p><h1>Insiden kebakaran lahan sintetis</h1><p className="muted">DLH memvalidasi kondisi lingkungan. BPBD memverifikasi insiden dan mengelola tindakan respons.</p></div><span className="badge tier-verify">{scenario.workflow.replaceAll("_", " ")}</span></header>
    <DemoScenarioMap surface="OPERATIONS" />
    {!scenario.observation ? <div className="workflow-empty"><strong>Menunggu Simulator</strong><span>Buka Simulation Center dan jalankan skenario data uji terlebih dahulu.</span></div> : <div className="workflow-columns"><article className="workflow-role-card"><p className="eyebrow">Ruang DLH</p><h2>Validasi lingkungan</h2><dl><div><dt>AQI</dt><dd>{scenario.observation.aqi}</dd></div><div><dt>PM2.5</dt><dd>{scenario.observation.pm25} µg/m³</dd></div><div><dt>Angin</dt><dd>{scenario.observation.wind}</dd></div></dl>{scenario.environmentalValidation ? <p className="role-done">✓ DLH telah memvalidasi data uji.</p> : <button className="button" type="button" disabled={role !== "DLH" || !readyForDlh} onClick={() => perform("VALIDATE_ENVIRONMENT")}>Validasi dampak lingkungan</button>}{role !== "DLH" && readyForDlh ? <small>Pilih peran DLH untuk melanjutkan tahap ini.</small> : null}</article>
      <article className="workflow-role-card"><p className="eyebrow">Ruang BPBD</p><h2>Verifikasi & respons</h2>{scenario.incident ? <p className="role-done">✓ Insiden sintetis telah diverifikasi BPBD.</p> : <button className="button" type="button" disabled={role !== "BPBD" || !readyForVerify} onClick={() => perform("VERIFY_INCIDENT")}>Verifikasi insiden</button>}{scenario.response ? <p className="role-done">✓ Tindakan respons telah dicatat.</p> : <button className="button secondary" type="button" disabled={role !== "BPBD" || !readyForResponse} onClick={() => perform("RECORD_RESPONSE")}>Catat tindakan respons</button>}{role !== "BPBD" && (readyForVerify || readyForResponse) ? <small>Hanya BPBD yang dapat memverifikasi insiden dan mencatat respons.</small> : null}</article></div>}
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}
