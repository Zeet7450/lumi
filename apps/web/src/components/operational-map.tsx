"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { demoReferencePoints, projectOperationalPoints, type OperationalPoint } from "@/lib/demo-locations";
import { useDemoScenario } from "./demo-scenario-store";

type Filter = "ALL" | "AFFECTED" | "ENVIRONMENT" | "INCIDENT";
type Sort = "SEVERITY" | "AQI" | "PM25" | "INCIDENT" | "LOCATION";

function aqiColor(aqi: number): string {
  if (aqi <= 50) return "#16a34a";
  if (aqi <= 100) return "#ca8a04";
  if (aqi <= 150) return "#ea580c";
  if (aqi <= 200) return "#dc2626";
  if (aqi <= 300) return "#7e22ce";
  return "#7f1d1d";
}

function incidentRank(point: OperationalPoint): number {
  if (point.incidentStatus === "Kebakaran sintetis") return 3;
  if (point.incidentStatus === "Asap sintetis") return 2;
  return 0;
}

function severity(point: OperationalPoint): number {
  return point.aqi + incidentRank(point) * 200 + (point.environmentalStatus === "Perlu verifikasi" ? 30 : 0);
}

function FitPoints({ points }: { points: readonly OperationalPoint[] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(points.map((point) => point.coordinates), { padding: [32, 32], maxZoom: 10, animate: false });
  }, [map, points]);
  return null;
}

function ResizeForSidebar() {
  const map = useMap();
  useEffect(() => {
    const resize = () => window.setTimeout(() => map.invalidateSize({ animate: false }), 220);
    window.addEventListener("lumi-sidebar-resize", resize);
    return () => window.removeEventListener("lumi-sidebar-resize", resize);
  }, [map]);
  return null;
}

function FullscreenButton({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const [isFullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === target.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [target]);
  const toggle = async () => {
    if (!target.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await target.current.requestFullscreen();
  };
  return <button className="map-fullscreen" type="button" onClick={() => void toggle()} aria-label={isFullscreen ? "Tutup layar penuh" : "Buka peta layar penuh"} title={isFullscreen ? "Tutup layar penuh" : "Layar penuh"}>⛶</button>;
}

export function OperationalMap() {
  const { scenario, role } = useDemoScenario();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [sort, setSort] = useState<Sort>("SEVERITY");
  const [selectedId, setSelectedId] = useState(demoReferencePoints[0]!.id);
  const frame = useRef<HTMLDivElement>(null);
  const points = useMemo(() => projectOperationalPoints(scenario), [scenario]);
  const selected = points.find((point) => point.id === selectedId) ?? points[0]!;
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id-ID");
    return points.filter((point) => {
      const matchesText = !needle || [point.name, point.province, point.kabupaten, point.kecamatan, point.kelurahan].join(" ").toLocaleLowerCase("id-ID").includes(needle);
      const matchesFilter = filter === "ALL" || (filter === "AFFECTED" && point.affected) || (filter === "ENVIRONMENT" && point.environmentalStatus !== "Tervalidasi") || (filter === "INCIDENT" && point.incidentStatus !== "Tidak ada");
      return matchesText && matchesFilter;
    }).sort((left, right) => {
      if (sort === "AQI") return right.aqi - left.aqi;
      if (sort === "PM25") return right.pm25 - left.pm25;
      if (sort === "INCIDENT") return incidentRank(right) - incidentRank(left) || right.aqi - left.aqi;
      if (sort === "LOCATION") return left.kabupaten.localeCompare(right.kabupaten, "id");
      return severity(right) - severity(left);
    });
  }, [filter, points, query, sort]);
  const affected = points.filter((point) => point.affected).length;
  const roleAction = role === "DLH" ? "Validasi lingkungan tersedia pada alur insiden." : "Verifikasi dan respons BPBD tersedia pada alur insiden.";

  return <section className="operational-map" aria-labelledby="operational-map-title">
    <header className="operational-map-head"><div><p className="eyebrow">Peta operasional · Kalimantan Barat</p><h2 id="operational-map-title">50 titik referensi data uji</h2><p className="muted">AQI dan PM2.5 adalah nilai sintetis untuk demo lokal, bukan pemantauan atau prediksi resmi.</p></div><span className="badge tier-verify">{affected} titik terdampak</span></header>
    <div className="operational-map-tools"><label>Cari titik atau wilayah<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nama, kabupaten, kecamatan…" /></label><label>Filter<select value={filter} onChange={(event) => setFilter(event.target.value as Filter)}><option value="ALL">Semua titik</option><option value="AFFECTED">Terdampak simulasi</option><option value="ENVIRONMENT">Perlu perhatian lingkungan</option><option value="INCIDENT">Ada insiden sintetis</option></select></label><label>Urutkan<select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="SEVERITY">Paling berat</option><option value="AQI">AQI tertinggi</option><option value="PM25">PM2.5 tertinggi</option><option value="INCIDENT">Status insiden</option><option value="LOCATION">Lokasi</option></select></label></div>
    <div className="operational-map-grid"><div ref={frame} className="operational-map-frame"><FullscreenButton target={frame} /><MapContainer center={[-0.35, 110.6]} zoom={7} minZoom={5} maxZoom={13} scrollWheelZoom className="operational-map-canvas" aria-label="Peta operasional data uji Kalimantan Barat"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitPoints points={points} /><ResizeForSidebar />{points.map((point) => <CircleMarker key={point.id} center={point.coordinates} radius={point.id === selected.id ? 10 : 8} pathOptions={{ color: point.incidentStatus === "Tidak ada" ? "#ffffff" : "#7f1d1d", fillColor: aqiColor(point.aqi), fillOpacity: 1, weight: point.incidentStatus === "Tidak ada" ? 2 : 5 }} eventHandlers={{ click: () => setSelectedId(point.id) }}><Tooltip>{point.name} · AQI {point.aqi}{point.incidentStatus !== "Tidak ada" ? ` · ${point.incidentStatus}` : ""}</Tooltip></CircleMarker>)}</MapContainer><span className="map-data-label">Visualisasi lokal · data sintetis</span><div className="aqi-legend" aria-label="Legenda AQI"><strong>AQI</strong><span><i className="aqi-good" />0–50</span><span><i className="aqi-moderate" />51–100</span><span><i className="aqi-sensitive" />101–150</span><span><i className="aqi-unhealthy" />151–200</span><span><i className="aqi-very-unhealthy" />201–300</span><span><i className="aqi-hazardous" />301+</span><em>Cincin gelap = insiden sintetis</em></div></div>
      <aside className="operational-point-panel"><div className="operational-point-detail"><p className="eyebrow">Detail titik</p><h3>{selected.name}</h3><p className="muted">{selected.kelurahan}, {selected.kecamatan}<br />{selected.kabupaten}, {selected.province}</p><dl><div><dt>AQI data uji</dt><dd style={{ color: aqiColor(selected.aqi) }}>{selected.aqi}</dd></div><div><dt>PM2.5</dt><dd>{selected.pm25} µg/m³</dd></div><div><dt>Tren</dt><dd>{selected.trend}</dd></div><div><dt>Lingkungan</dt><dd>{selected.environmentalStatus}</dd></div><div><dt>Insiden</dt><dd>{selected.incidentStatus}</dd></div><div><dt>Dampak</dt><dd>{selected.impact}</dd></div></dl>{selected.wind ? <p className="point-wind">Angin/dampak: {selected.wind} · radius {selected.radiusKm} km</p> : null}<p className="point-action"><strong>Tindakan berwenang:</strong> {selected.authorizedAction}</p><p className="freshness">{roleAction}</p></div><div className="operational-point-list" aria-label="Daftar titik operasional">{visible.map((point) => <button key={point.id} className={point.id === selected.id ? "is-selected" : ""} type="button" onClick={() => setSelectedId(point.id)}><i style={{ background: aqiColor(point.aqi) }} /><span><strong>{point.name}</strong><small>{point.kabupaten} · AQI {point.aqi} · PM2.5 {point.pm25}</small></span>{point.incidentStatus !== "Tidak ada" ? <b>●</b> : null}</button>) || <p className="muted">Tidak ada titik yang cocok.</p>}</div></aside></div>
  </section>;
}
