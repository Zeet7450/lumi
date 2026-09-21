"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDemoScenario } from "./demo-scenario-store";
import { OperationalMap } from "./operational-map";

export function IncidentsBoard() {
  const { scenario, role, run } = useDemoScenario();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const perform = (type: "VALIDATE_ENVIRONMENT" | "VERIFY_INCIDENT" | "RECORD_RESPONSE") => {
    try { setError(""); run({ type }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Tindakan demo tidak dapat dijalankan."); }
  };
  const readyForDlh = scenario.workflow === "ENVIRONMENT_PENDING";
  const readyForVerify = scenario.workflow === "ENVIRONMENT_VALIDATED";
  const readyForResponse = scenario.workflow === "INCIDENT_VERIFIED";
  const requestedRoom = searchParams.get("ruang");
  const room = role === "DLH"
    ? requestedRoom === "validasi" || requestedRoom === "riwayat" ? requestedRoom : "lingkungan"
    : requestedRoom === "tindakan" || requestedRoom === "status" ? requestedRoom : "situasi";
  const roomCopy = {
    lingkungan: ["Peta lingkungan", "Pantau 50 titik referensi lingkungan dan kualitas udara sintetis."],
    validasi: ["Validasi observasi", "Tinjau dampak lingkungan sebelum insiden dapat diverifikasi BPBD."],
    riwayat: ["Riwayat kondisi", "Jejak perubahan kondisi dan keputusan pada skenario data uji."],
    situasi: ["Peta situasi", "Pantau sebaran kondisi sintetis sebelum memverifikasi insiden."],
    tindakan: ["Verifikasi & tindakan", "BPBD memverifikasi insiden dan mencatat tindakan respons."],
    status: ["Status respons", "Lihat status verifikasi, respons, dan kesiapan informasi warga."]
  } as const;
  const [title, description] = roomCopy[room];
  const observation = scenario.observation ? <dl><div><dt>AQI</dt><dd>{scenario.observation.aqi}</dd></div><div><dt>PM2.5</dt><dd>{scenario.observation.pm25} µg/m³</dd></div><div><dt>Angin</dt><dd>{scenario.observation.wind}</dd></div></dl> : null;
  const waiting = <div className="workflow-empty"><strong>Menunggu Simulator</strong><span>Jalankan skenario data uji terlebih dahulu agar observasi dapat ditinjau.</span></div>;
  const validation = <article className="workflow-role-card"><p className="eyebrow">Ruang DLH</p><h2>Validasi lingkungan</h2>{observation}{scenario.environmentalValidation ? <p className="role-done">✓ DLH telah memvalidasi data uji.</p> : <button className="button" type="button" disabled={role !== "DLH" || !readyForDlh} onClick={() => perform("VALIDATE_ENVIRONMENT")}>Validasi dampak lingkungan</button>}</article>;
  const response = <article className="workflow-role-card"><p className="eyebrow">Ruang BPBD</p><h2>Verifikasi & respons</h2>{scenario.incident ? <p className="role-done">✓ Insiden sintetis telah diverifikasi BPBD.</p> : <button className="button" type="button" disabled={role !== "BPBD" || !readyForVerify} onClick={() => perform("VERIFY_INCIDENT")}>Verifikasi insiden</button>}{scenario.response ? <p className="role-done">✓ Tindakan respons telah dicatat.</p> : <button className="button secondary" type="button" disabled={role !== "BPBD" || !readyForResponse} onClick={() => perform("RECORD_RESPONSE")}>Catat tindakan respons</button>}</article>;
  const history = <section className="workflow-history"><p className="eyebrow">Riwayat data uji</p>{scenario.events.length ? <ol>{scenario.events.slice().reverse().map((event) => <li key={`${event.at}-${event.command}`}><strong>{event.command.replaceAll("_", " ")}</strong><span>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.at))}</span></li>)}</ol> : <div className="workflow-empty"><strong>Belum ada riwayat</strong><span>Riwayat akan muncul setelah Simulator menjalankan skenario.</span></div>}</section>;
  const status = <section className="workflow-history"><p className="eyebrow">Status lintas instansi</p><ol><li><strong>Lingkungan</strong><span>{scenario.environmentalValidation ? "Tervalidasi DLH" : "Menunggu validasi DLH"}</span></li><li><strong>Insiden</strong><span>{scenario.incident ? "Terverifikasi BPBD" : "Menunggu verifikasi BPBD"}</span></li><li><strong>Respons</strong><span>{scenario.response ? "Tindakan dicatat BPBD" : "Menunggu tindakan BPBD"}</span></li></ol></section>;
  return <section className="workflow-board">
    <header className="ops-header"><div><p className="eyebrow">Antrean keputusan · {scenario.region.province}</p><h1>{title}</h1><p className="muted">{description}</p></div><span className="badge tier-verify">{scenario.workflow.replaceAll("_", " ")}</span></header>
    {(room === "lingkungan" || room === "situasi") ? <OperationalMap /> : null}
    {room === "validasi" ? (scenario.observation ? validation : waiting) : null}
    {room === "riwayat" ? history : null}
    {room === "tindakan" ? (scenario.observation ? response : waiting) : null}
    {room === "status" ? status : null}
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}
