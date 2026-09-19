"use client";

import { useEffect, useState } from "react";
import { freshnessLabel, getIncidents, tierLabel, type IncidentSummary } from "@/lib/lumi";

function tierClass(tier: IncidentSummary["tier"]) { return tier === "HIGH_RESPONSE" ? "tier-high" : tier === "VERIFY" ? "tier-verify" : "tier-monitor"; }

export function IncidentsBoard() {
  const [result, setResult] = useState<{ incidents: IncidentSummary[]; preview: boolean }>();
  const [filter, setFilter] = useState<"ALL" | IncidentSummary["tier"]>("ALL");
  useEffect(() => { void getIncidents().then(setResult); }, []);
  if (!result) return <p aria-busy="true">Memuat antrean insiden…</p>;
  const incidents = result.incidents.filter((incident) => filter === "ALL" || incident.tier === filter);
  return <><div className="ops-header"><div><p className="eyebrow">Pusat kendali</p><h1>Antrean keputusan</h1><p className="muted">Urutan dibuat dari aturan prioritas. Petugas tidak mengubah tier secara manual.</p></div><label className="field" style={{ minWidth: 170 }}>Filter tier<select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="ALL">Semua tier</option><option value="HIGH_RESPONSE">Respons Tinggi</option><option value="VERIFY">Verifikasi</option><option value="MONITOR">Pantau</option></select></label></div>{result.preview && <p className="preview">Sambungan data belum tersedia.</p>}<div className="cards" data-tour="priority">{incidents.map((incident, index) => <article className="incident" key={incident.id}><div className="incident-head"><div><p className="eyebrow">Prioritas {String(index + 1).padStart(2, "0")}</p><h2>{incident.region.name}, {incident.region.province}</h2></div><span className={`badge ${tierClass(incident.tier)}`}>● {tierLabel(incident.tier)}</span></div><p data-tour={index === 0 ? "reason" : undefined}>{incident.rationale.join(" · ")}</p><div className="meta"><span>{freshnessLabel(incident.freshness)}</span><span>Status kerja: {incident.workflowStatus === "OPEN" ? "Terbuka" : "Selesai"}</span></div></article>)}</div></>;
}
