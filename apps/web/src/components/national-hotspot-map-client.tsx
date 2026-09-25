"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { loadProvinceBoundaries, type ProvinceFeature } from "@/lib/national-points";
import { GridClusterLayer } from "./grid-cluster-layer";
import { confidenceBand, generateHotspots, HOTSPOT_DENSITIES, sortHotspots, type ConfidenceSort, type Hotspot } from "@/lib/hotspots";

type PointMode = "CLUSTER" | "INDIVIDUAL";

const INDONESIA_BOUNDS: [[number, number], [number, number]] = [[-11.2, 94.4], [6.4, 141.3]];

function inkFor(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111827" : "#FFFFFF";
}

/** Cluster tone = the strongest band inside it: danger must never be averaged away. */
function dominantColor(confidences: number[]): string {
  if (confidences.some((value) => value >= 80)) return "#DC2626";
  if (confidences.some((value) => value >= 30)) return "#E8B931";
  return "#22A55B";
}

function hotspotPointIcon(point: Hotspot, isSelected: boolean): L.DivIcon {
  const band = confidenceBand(point.confidence);
  return L.divIcon({ className: `hotspot-marker${isSelected ? " is-selected" : ""}`, html: `<span style="background:${band.color};color:${band.ink}">${point.confidence}%</span>`, iconSize: [40, 40], iconAnchor: [20, 20] });
}

/** Same small-group rule as the ISPU map: only cells above 15 cluster. */
function ClusterLayer({ points, selectedId, onSelect }: { points: Hotspot[]; selectedId: string | null; onSelect: (point: Hotspot) => void }) {
  return <GridClusterLayer
    points={points}
    pointId={(point) => point.id}
    selectedId={selectedId}
    onSelect={onSelect}
    createMarker={(point, isSelected) => {
      const marker = L.marker([point.lat, point.lng], { icon: hotspotPointIcon(point, isSelected) });
      marker.bindTooltip(`${point.name} · keyakinan ${point.confidence}% (${confidenceBand(point.confidence).name})`, { direction: "top", offset: [0, -16] });
      return marker;
    }}
    clusterIcon={(count, members) => {
      const color = dominantColor(members.map((point) => point.confidence));
      return L.divIcon({ className: "ispu-cluster", html: `<span style="background:${color};color:${inkFor(color)}">${count}</span>`, iconSize: [40, 40] });
    }}
  />;
}

function IndividualLayer({ points, selectedId, onSelect }: { points: Hotspot[]; selectedId: string | null; onSelect: (point: Hotspot) => void }) {
  return <GridClusterLayer
    points={points}
    pointId={(point) => point.id}
    selectedId={selectedId}
    onSelect={onSelect}
    maxPerCell={Number.POSITIVE_INFINITY}
    createMarker={(point, isSelected) => {
      const marker = L.marker([point.lat, point.lng], { icon: hotspotPointIcon(point, isSelected) });
      marker.bindTooltip(`${point.name} · keyakinan ${point.confidence}% (${confidenceBand(point.confidence).name})`, { direction: "top", offset: [0, -16] });
      return marker;
    }}
    clusterIcon={() => L.divIcon({ className: "ispu-cluster", html: "", iconSize: [0, 0] })}
  />;
}

function CaptureMap({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => { onReady(map); }, [map, onReady]);
  return null;
}

export default function NationalHotspotMapClient() {
  const [boundaries, setBoundaries] = useState<ProvinceFeature[]>([]);
  const [density, setDensity] = useState<number>(2_000);
  const [province, setProvince] = useState("all");
  const [sort, setSort] = useState<ConfidenceSort>("CONF_DESC");
  const [pointMode, setPointMode] = useState<PointMode>("CLUSTER");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [map, setMap] = useState<LeafletMap>();
  const [selected, setSelected] = useState<Hotspot | null>(null);

  useEffect(() => {
    let active = true;
    loadProvinceBoundaries()
      .then((features) => { if (active) { setBoundaries(features); setStatus("ready"); } })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);

  const points = useMemo(() => generateHotspots(boundaries, density), [boundaries, density]);
  const visible = useMemo(() => points.filter((point) => province === "all" || point.provinceSlug === province), [points, province]);
  const sorted = useMemo(() => sortHotspots(visible, sort), [visible, sort]);
  const stats = useMemo(() => {
    if (!visible.length) return null;
    const values = visible.map((point) => point.confidence);
    const high = values.filter((value) => value >= 80).length;
    const mid = values.filter((value) => value >= 30 && value < 80).length;
    const low = values.filter((value) => value < 30).length;
    return { count: visible.length, high, mid, low };
  }, [visible]);

  useEffect(() => {
    if (!map || province === "all") return;
    const bounds = visible.map((point) => [point.lat, point.lng] as [number, number]);
    if (bounds.length) map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24], maxZoom: 9 });
    else map.fitBounds(INDONESIA_BOUNDS, { padding: [12, 12] });
  }, [map, province]);

  const selectPoint = useCallback((point: Hotspot) => { setSelected(point); map?.setView([point.lat, point.lng], 10, { animate: true }); }, [map]);
  const activePoint = selected ?? sorted[0] ?? null;

  return <section className="command-panel live-map" aria-labelledby="national-hotspot-title">
    <div className="panel-head"><div><p className="eyebrow">Deteksi titik api nasional</p><h2 id="national-hotspot-title">Hotspot se-Indonesia</h2></div><span className="map-live">{visible.length.toLocaleString("id-ID")} hotspot</span></div>
    <div className="map-tool-row"><div className="layer-controls">
      <label className="has-label"><span>Provinsi</span><select aria-label="Filter provinsi" value={province} onChange={(event) => setProvince(event.target.value)}><option value="all">Seluruh Indonesia</option>{boundaries.map((feature) => <option key={feature.slug} value={feature.slug}>{feature.name}</option>)}</select></label>
      <label className="has-label"><span>Sortir</span><select aria-label="Sortir hotspot" value={sort} onChange={(event) => setSort(event.target.value as ConfidenceSort)}><option value="CONF_DESC">Titik terpanas</option><option value="CONF_ASC">Titik teraman</option><option value="NAME_ASC">Nama lokasi (A–Z)</option></select></label>
      <label className="has-label"><span>Kepadatan titik</span><select aria-label="Jumlah hotspot simulasi" value={density} onChange={(event) => setDensity(Number(event.target.value))}>{HOTSPOT_DENSITIES.map((value) => <option key={value} value={value}>{value.toLocaleString("id-ID")} hotspot</option>)}</select></label>
      <label className="has-label"><span>Tampilan titik</span><select aria-label="Mode tampilan titik" value={pointMode} onChange={(event) => setPointMode(event.target.value as PointMode)}><option value="CLUSTER">Gabungan (cluster)</option><option value="INDIVIDUAL">Setiap titik</option></select></label>
    </div></div>
    {status === "loading" ? <div className="workflow-empty"><strong>Memuat peta hotspot</strong><span>Menyiapkan {density.toLocaleString("id-ID")} titik deteksi di 38 provinsi.</span></div> : null}
    {status === "error" ? <div className="workflow-empty" role="alert"><strong>Peta tidak dapat dimuat</strong><span>Periksa berkas /geo/indonesia-provinces.geojson pada aplikasi ini.</span></div> : null}
    {status === "ready" ? <div className="leaflet-frame">
      <MapContainer center={[-2.2, 118]} zoom={4} minZoom={3} maxZoom={16} scrollWheelZoom className="leaflet-canvas" aria-label={`Peta hotspot nasional dengan ${visible.length} titik simulasi`}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <CaptureMap onReady={setMap} />
        {pointMode === "CLUSTER" ? <ClusterLayer points={visible} selectedId={activePoint?.id ?? null} onSelect={selectPoint} /> : <IndividualLayer points={visible} selectedId={activePoint?.id ?? null} onSelect={selectPoint} />}
      </MapContainer>
    </div> : null}
    <div className="map-legend" aria-label="Legenda tingkat kepercayaan hotspot">{[80, 30, 0].map((value) => { const band = confidenceBand(value); return <span key={band.tone}><i style={{ background: band.color }} />{band.range} · {band.name}</span>; })}</div>
    {stats ? <div className="ispu-summary" aria-live="polite">
      <div><dt>{province === "all" ? "Seluruh Indonesia" : boundaries.find((feature) => feature.slug === province)?.name}</dt><dd>{stats.count.toLocaleString("id-ID")} hotspot</dd></div>
      <div><dt>Kepercayaan tinggi</dt><dd style={{ color: "#DC2626" }}>{stats.high.toLocaleString("id-ID")}</dd></div>
      <div><dt>Kepercayaan sedang</dt><dd style={{ color: "#B45309" }}>{stats.mid.toLocaleString("id-ID")}</dd></div>
      <div><dt>Kepercayaan rendah</dt><dd style={{ color: "#15803D" }}>{stats.low.toLocaleString("id-ID")}</dd></div>
    </div> : null}
    <div className="ispu-point-panel ispu-point-panel-static">
      {activePoint ? <div className="ispu-point-detail"><span className="status-dot" style={{ background: confidenceBand(activePoint.confidence).color }} /><div><p className="eyebrow">Hotspot dipilih</p><h3>{activePoint.name}</h3><p className="muted">{activePoint.province}</p></div><dl><div><dt>Keyakinan</dt><dd style={{ color: confidenceBand(activePoint.confidence).color }}>{activePoint.confidence}%</dd></div><div><dt>Kategori</dt><dd>{confidenceBand(activePoint.confidence).name}</dd></div><div><dt>Koordinat</dt><dd>{activePoint.lat}, {activePoint.lng}</dd></div></dl></div> : <div className="ispu-point-detail"><p className="muted">Pilih titik pada peta atau daftar di bawah untuk melihat detailnya.</p></div>}
      <div className="ispu-point-list" aria-label="Daftar hotspot sesuai sortir">{sorted.slice(0, 500).map((point) => { const band = confidenceBand(point.confidence); return <button key={point.id} className={activePoint?.id === point.id ? "is-selected" : ""} type="button" onClick={() => selectPoint(point)}><i aria-hidden style={{ background: band.color }} /><span className="ispu-point-copy"><strong>{point.name}</strong><small>{point.province}</small></span><b>{point.confidence}%</b></button>; })}{sorted.length > 500 ? <p className="muted ispu-point-list-note">Menampilkan 500 dari {sorted.length.toLocaleString("id-ID")} hotspot. Perkecil filter provinsi untuk melihat semuanya.</p> : null}</div>
    </div>
  </section>;
}
