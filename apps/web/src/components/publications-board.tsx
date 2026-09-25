"use client";

import { useState } from "react";
import { useDemoScenario } from "./demo-scenario-store";

export function PublicationsBoard() {
  const { scenario, role, run } = useDemoScenario();
  const [error, setError] = useState("");
  const publish = () => { try { setError(""); run({ type: "PUBLISH_NOTICE" }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Publikasi tidak dapat dilakukan."); } };
  return <section className="ops-panel workflow-publication"><div className="ops-header"><div><p className="eyebrow">Persetujuan manusia</p><h1>Publikasi untuk warga</h1><p className="muted">Draf hanya dapat terbit setelah DLH memvalidasi dampak dan BPBD mencatat respons.</p></div><span className="badge tier-verify">{scenario.notice?.status === "PUBLISHED" ? "TERBIT" : "MENUNGGU DRAF"}</span></div>{scenario.notice ? <><article className="notice-draft"><p className="eyebrow">Draf informasi warga · data sintetis</p><p>{scenario.notice.text}</p></article>{scenario.notice.status === "PUBLISHED" ? <p className="role-done">✓ Approver telah menerbitkan informasi warga. Portal warga sekarang hanya menampilkan versi ini.</p> : <><div className="callout"><strong>Pemeriksaan approver.</strong> Ini adalah tindakan manusia. Sistem tidak dapat menerbitkan informasi secara otomatis.</div><button className="button" type="button" disabled={role !== "APPROVER" || scenario.workflow !== "RESPONSE_RECORDED"} onClick={publish}>Terbitkan untuk warga</button>{role !== "APPROVER" && <p className="preview">Pilih peran Approver untuk menyetujui dan menerbitkan draf ini.</p>}</>}</> : <div className="workflow-empty"><strong>Belum ada draf</strong><span>BPBD perlu mencatat tindakan respons sebelum draf informasi warga dibuat.</span></div>}{error && <p className="error" role="alert">{error}</p>}</section>;
}
