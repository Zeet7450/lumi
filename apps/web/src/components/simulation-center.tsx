"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatTime, getDemoTelemetryHistory, getSimulatorLocations, sendDemoTelemetry, type DemoDelivery, type DemoTelemetryInput, type SimulatorLocation } from "@/lib/lumi";

const initial: DemoTelemetryInput = { locationId: "kota-pontianak", aqi: 82, hazards: [] };
const hazardLabels = { FIRE: "Indikasi kebakaran", VOLCANIC_ASH: "Indikasi abu vulkanik", FLOOD: "Indikasi banjir" } as const;
type HazardType = keyof typeof hazardLabels;

export function SimulationCenter() {
  const [input, setInput] = useState<DemoTelemetryInput>(initial);
  const inputRef = useRef(input);
  const [locations, setLocations] = useState<SimulatorLocation[]>([]);
  const [province, setProvince] = useState("kalbar");
  const [intervalSeconds, setIntervalSeconds] = useState<30 | 60>(30);
  const [streaming, setStreaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deliveries, setDeliveries] = useState<DemoDelivery[]>([]);
  const [lastSentAt, setLastSentAt] = useState<string>();
  const [error, setError] = useState("");
  const grouped = useMemo(() => locations.filter((location) => location.provinceSlug === province), [locations, province]);
  const activeLocation = locations.find((location) => location.id === input.locationId);
  const event = input.hazards[0];
  useEffect(() => { inputRef.current = input; }, [input]);
  useEffect(() => { void Promise.all([getSimulatorLocations(), getDemoTelemetryHistory()]).then(([available, history]) => { setLocations(available); setDeliveries(history); }).catch(() => setError("Data simulator belum dapat dimuat. Periksa backend dan sesi Admin Simulator.")); }, []);
  const update = <K extends keyof DemoTelemetryInput>(key: K, value: DemoTelemetryInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  function updateProvince(next: string) { setProvince(next); const first = locations.find((location) => location.provinceSlug === next); if (first) update("locationId", first.id); }
  function selectEvent(type: "NONE" | HazardType) { update("hazards", type === "NONE" ? [] : [{ type, severity: event?.type === type ? event.severity : 1 }]); }
  function severity(value: number) { if (event) update("hazards", [{ ...event, severity: value }]); }
  async function send(payload = inputRef.current) {
    if (busy) return;
    setBusy(true); setError("");
    try { const receipt = await sendDemoTelemetry(payload); const delivery = { ...receipt, locationName: activeLocation?.city ?? payload.locationId, aqi: payload.aqi }; setLastSentAt(receipt.receivedAt); setDeliveries((current) => [delivery, ...current].slice(0, 8)); }
    catch (reason) { setError(reason instanceof Error && reason.message === "401" ? "Sesi Admin Simulator telah berakhir. Masuk kembali untuk mengirim data." : "Data belum terkirim. Pastikan backend LUMI aktif."); }
    finally { setBusy(false); }
  }
  useEffect(() => { if (!streaming) return; void send(); const timer = window.setInterval(() => void send(), intervalSeconds * 1000); return () => window.clearInterval(timer); }, [streaming, intervalSeconds]);
  return <div className="simulator-console">
    <header className="simulator-intro"><div><p className="eyebrow">Ruang pengiriman terisolasi</p><h1>Kirim satu skenario data</h1><p className="muted">Pilih wilayah, isi AQI, lalu tambahkan satu indikasi kejadian bila diperlukan. Sistem Ops menghitung PM2.5, prioritas, dan tampilan peta secara otomatis.</p></div><div className={`delivery-state ${streaming ? "is-on" : ""}`}><span className="live-pulse" />{streaming ? `Pengiriman berkala · ${intervalSeconds} detik` : "Siap mengirim"}</div></header>
    <div className="simulator-grid"><section className="simulator-form-card" aria-labelledby="telemetry-form-title"><div className="panel-head"><div><p className="eyebrow">Skenario data palsu</p><h2 id="telemetry-form-title">Kirim pembaruan wilayah</h2></div><span className="form-required">* wajib</span></div>
      <fieldset className="form-group"><legend>Wilayah</legend><div className="form-columns"><label className="field">Provinsi *<select value={province} onChange={(event) => updateProvince(event.target.value)}>{[...new Map(locations.map((item) => [item.provinceSlug, item.province])).entries()].map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}</select></label><label className="field">Kabupaten/kota *<select value={input.locationId} onChange={(event) => update("locationId", event.target.value)}>{grouped.map((location) => <option key={location.id} value={location.id}>{location.city}</option>)}</select></label></div></fieldset>
      <fieldset className="form-group"><legend>Kualitas udara</legend><label className="field">AQI *<input type="number" min="0" max="500" inputMode="numeric" value={input.aqi} onChange={(event) => update("aqi", Number(event.target.value))} /><span>0–50 baik · 51–100 sedang · 101–150 tidak sehat bagi kelompok sensitif · 151+ tidak sehat.</span></label></fieldset>
      <fieldset className="form-group"><legend>Indikasi kejadian</legend><div className="form-columns"><label className="field">Kejadian<select value={event?.type ?? "NONE"} onChange={(event) => selectEvent(event.target.value as "NONE" | HazardType)}><option value="NONE">Tidak ada</option>{(Object.keys(hazardLabels) as HazardType[]).map((type) => <option key={type} value={type}>{hazardLabels[type]}</option>)}</select><span>Hanya indikasi data demo, bukan kejadian terverifikasi.</span></label>{event ? <label className="field">Tingkat *<select value={event.severity} onChange={(event) => severity(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select><span>1–2 verifikasi · 3–5 respons tinggi.</span></label> : null}</div></fieldset>
      <div className="simulator-actions"><button className="button" type="button" onClick={() => void send()} disabled={busy || !activeLocation}>{busy ? "Mengirim…" : "Kirim data palsu"}</button><label className="compact-select">Interval berkala<select value={intervalSeconds} onChange={(event) => setIntervalSeconds(Number(event.target.value) as 30 | 60)} disabled={streaming}><option value={30}>30 detik</option><option value={60}>60 detik</option></select></label><button className="button secondary" type="button" onClick={() => setStreaming((value) => !value)} disabled={busy || !activeLocation}>{streaming ? "Hentikan berkala" : "Mulai berkala"}</button></div>{error ? <p className="error" role="alert">{error}</p> : null}
    </section><aside className="simulator-history" aria-live="polite"><div className="panel-head"><div><p className="eyebrow">Riwayat sesi</p><h2>Pengiriman diterima</h2></div>{lastSentAt ? <span className="accepted-badge">Diterima</span> : null}</div><p className="muted small">Ruang ini tidak menampilkan keputusan prioritas.</p>{deliveries.length ? <ol className="delivery-list">{deliveries.map((delivery) => <li key={delivery.id}><div><strong>{delivery.locationName}</strong><span>{formatTime(delivery.receivedAt)}</span></div><dl><div><dt>AQI</dt><dd>{delivery.aqi}</dd></div><div><dt>Status</dt><dd>Diterima</dd></div></dl></li>)}</ol> : <div className="history-empty"><strong>Belum ada pengiriman</strong><span>Kirim data pertama untuk membuat jejak penerimaan.</span></div>}</aside></div>
    <div className="simulation-boundary"><strong>SIMULASI DATA</strong><span>Tidak memicu evakuasi, tidak membuat publikasi, dan tidak dikirim ke warga.</span></div><p className="simulator-location-summary">Lokasi aktif: <strong>{activeLocation?.city ?? "Memuat lokasi"}</strong></p>
  </div>;
}
