"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { ISPU_BANDS, ispuBand, ispuColor, ispuLabel } from "@/lib/ispu";
import { GridClusterLayer } from "./grid-cluster-layer";
import { generateNationalPoints, loadProvinceBoundaries, POINT_DENSITIES, sortNationalPoints, type NationalPoint, type NationalSort, type ProvinceFeature } from "@/lib/national-points";

type PointMode = "CLUSTER" | "INDIVIDUAL";

/** Cluster colour is the average of every child point's band colour — a real composition, not a flat brand tint. */
function blendColors(colors: readonly string[]): string {
  if (!colors.length) return "#8793A4";
  let r = 0, g = 0, b = 0;
  for (const hex of colors) {
    const value = hex.replace("#", "");
    r += parseInt(value.slice(0, 2), 16);
    g += parseInt(value.slice(2, 4), 16);
    b += parseInt(value.slice(4, 6), 16);
  }
  const n = colors.length;
  const channel = (sum: number) => Math.round(sum / n).toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function inkFor(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111827" : "#FFFFFF";
}

function ispuPointIcon(point: NationalPoint, isSelected: boolean): L.DivIcon {
  const band = ispuBand(point.aqi)!;
  return L.divIcon({ className: `ispu-marker${isSelected ? " is-selected" : ""}`, html: `<span style="background:${band.color};color:${band.ink}">${point.aqi}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] });
}

/**
 * Clustering with the product's small-group rule: a cell holding more than 15
 * points becomes one cluster; 15 or fewer always render as their own points.
 * One zoom step is therefore enough to separate any small group.
 */
function ClusterLayer({ points, selectedId, onSelect }: { points: NationalPoint[]; selectedId: string | null; onSelect: (point: NationalPoint) => void }) {
  return <GridClusterLayer
    points={points}
    pointId={(point) => point.id}
    selectedId={selectedId}
    onSelect={onSelect}
    createMarker={(point, isSelected) => {
      const marker = L.marker([point.lat, point.lng], { icon: ispuPointIcon(point, isSelected) });
      marker.bindTooltip(`${point.name} · ISPU ${point.aqi} (${ispuBand(point.aqi)!.name})`, { direction: "top", offset: [0, -12] });
      return marker;
    }}
    clusterIcon={(count, members) => {
      const colors = members.map((point) => ispuColor(point.aqi));
      const blended = blendColors(colors);
      return L.divIcon({ className: "ispu-cluster", html: `<span style="background:${blended};color:${inkFor(blended)}">${count}</span>`, iconSize: [40, 40] });
    }}
  />;
}

/** Individual mode skips clustering entirely: every point renders on its own. */
function IndividualLayer({ points, selectedId, onSelect }: { points: NationalPoint[]; selectedId: string | null; onSelect: (point: NationalPoint) => void }) {
  return <GridClusterLayer
    points={points}
    pointId={(point) => point.id}
    selectedId={selectedId}
    onSelect={onSelect}
    maxPerCell={Number.POSITIVE_INFINITY}
    createMarker={(point, isSelected) => {
      const marker = L.marker([point.lat, point.lng], { icon: ispuPointIcon(point, isSelected) });
      marker.bindTooltip(`${point.name} · ISPU ${point.aqi} (${ispuBand(point.aqi)!.name})`, { direction: "top", offset: [0, -14] });
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

function ResizeMapOnHeightChange({ height }: { height: number }) {
  const map = useMap();
  useEffect(() => { const id = window.setTimeout(() => map.invalidateSize({ animate: false }), 60); return () => window.clearTimeout(id); }, [height, map]);
  return null;
}

function ringsOf(feature: ProvinceFeature): Array<[number, number][]> {
  const polygons: number[][][][] = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates as number[][][]] : feature.geometry.coordinates as number[][][][];
  return polygons.map((polygon) => (polygon[0] ?? []).map(([lng, lat]) => [lat!, lng!] as [number, number]));
}

const INDONESIA_BOUNDS: [[number, number], [number, number]] = [[-11.2, 94.4], [6.4, 141.3]];
const MIN_PANEL_HEIGHT = 280;
const MAX_PANEL_HEIGHT = 900;

export default function NationalIspuMapClient({ citizen = false }: { citizen?: boolean }) {
  const [boundaries, setBoundaries] = useState<ProvinceFeature[]>([]);
  const [density, setDensity] = useState<number>(2_000);
  const [province, setProvince] = useState("all");
  const [sort, setSort] = useState<NationalSort>("AQI_DESC");
  const [pointMode, setPointMode] = useState<PointMode>("CLUSTER");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [map, setMap] = useState<LeafletMap>();
  const [selected, setSelected] = useState<NationalPoint | null>(null);
  const [panelHeight, setPanelHeight] = useState(420);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const frame = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("pointerdown", onPointerDown); window.removeEventListener("keydown", onKeyDown); };
  }, [menuOpen]);

  useEffect(() => {
    let active = true;
    loadProvinceBoundaries()
      .then((features) => { if (active) { setBoundaries(features); setStatus("ready"); } })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);

  const points = useMemo(() => generateNationalPoints(boundaries, density), [boundaries, density]);
  const selectedFeature = useMemo(() => boundaries.find((feature) => feature.slug === province) ?? null, [boundaries, province]);
  const visible = useMemo(() => points.filter((point) => province === "all" || point.provinceSlug === selectedFeature?.slug), [points, province, selectedFeature]);
  const sorted = useMemo(() => sortNationalPoints(visible, sort), [visible, sort]);
  const stats = useMemo(() => {
    if (!visible.length) return null;
    const values = visible.map((point) => point.aqi);
    const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    return { count: visible.length, average, worst: Math.max(...values), best: Math.min(...values) };
  }, [visible]);

  useEffect(() => {
    if (!map) return;
    if (selectedFeature) {
      const rings = ringsOf(selectedFeature);
      const flat = rings.flat();
      if (flat.length) map.fitBounds(L.latLngBounds(flat), { padding: [24, 24], maxZoom: 8 });
    } else {
      map.fitBounds(INDONESIA_BOUNDS, { padding: [12, 12] });
    }
  }, [map, selectedFeature]);

  const selectPoint = useCallback((point: NationalPoint) => { setSelected(point); map?.setView([point.lat, point.lng], 11, { animate: true }); }, [map]);
  const toggleFullscreen = () => {
    if (!frame.current) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.current.requestFullscreen();
  };

  const onResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = { startY: event.clientY, startHeight: panelHeight };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer not active in this input mode; drag still works via move/up */ }
  };
  const onResizeMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const delta = event.clientY - dragState.current.startY;
    setPanelHeight(Math.min(MAX_PANEL_HEIGHT, Math.max(MIN_PANEL_HEIGHT, dragState.current.startHeight + delta)));
  };
  const onResizeEnd = () => { dragState.current = null; };

  const activePoint = selected ?? sorted[0] ?? null;

  return <section className={`command-panel live-map${citizen ? " citizen-map" : ""}`} aria-labelledby="national-ispu-title">
    {citizen ? null : <div className="panel-head"><div><p className="eyebrow">Pemantauan nasional · standar ISPU</p><h2 id="national-ispu-title">Peta ISPU 38 provinsi</h2></div><span className="map-live">{visible.length.toLocaleString("id-ID")} titik</span></div>}
    {citizen ? null : <div className="map-tool-row"><div className="layer-controls">
      <label className="has-label"><span>Provinsi</span><select aria-label="Filter provinsi" value={province} onChange={(event) => setProvince(event.target.value)}><option value="all">Seluruh Indonesia</option>{boundaries.map((feature) => <option key={feature.slug} value={feature.slug}>{feature.name}</option>)}</select></label>
      <label className="has-label"><span>Sortir</span><select aria-label="Sortir titik" value={sort} onChange={(event) => setSort(event.target.value as NationalSort)}><option value="NAME_ASC">Nama lokasi (A–Z)</option><option value="AQI_ASC">ISPU terendah</option><option value="AQI_DESC">ISPU tertinggi</option></select></label>
      <label className="has-label"><span>Kepadatan titik</span><select aria-label="Jumlah titik simulasi" value={density} onChange={(event) => setDensity(Number(event.target.value))}>{POINT_DENSITIES.map((value) => <option key={value} value={value}>{value.toLocaleString("id-ID")} titik</option>)}</select></label>
      <label className="has-label"><span>Tampilan titik</span><select aria-label="Mode tampilan titik" value={pointMode} onChange={(event) => setPointMode(event.target.value as PointMode)}><option value="CLUSTER">Gabungan (cluster)</option><option value="INDIVIDUAL">Setiap titik</option></select></label>
    </div></div>}
    {status === "loading" ? <div className="workflow-empty"><strong>Memuat batas provinsi</strong><span>Menyiapkan {density.toLocaleString("id-ID")} titik simulasi di 38 provinsi.</span></div> : null}
    {status === "error" ? <div className="workflow-empty" role="alert"><strong>Batas provinsi tidak dapat dimuat</strong><span>Periksa berkas /geo/indonesia-provinces.geojson pada aplikasi ini.</span></div> : null}
    {status === "ready" ? <div className="leaflet-frame" ref={frame}>
      <button className="map-fullscreen" type="button" onClick={toggleFullscreen} aria-label="Buka peta layar penuh" title="Layar penuh"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m13-5v4a1 1 0 0 1-1 1h-4" /></svg></button>
      <div className="map-menu-anchor" ref={menuRef}>
        <button className="map-menu-toggle" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Pengaturan peta" title="Pengaturan peta"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>
        {menuOpen ? <div className="map-menu-panel" role="dialog" aria-label="Pengaturan peta">
          <p className="map-menu-title">Pengaturan peta</p>
          <label className="has-label"><span>Provinsi</span><select aria-label="Filter provinsi" value={province} onChange={(event) => setProvince(event.target.value)}><option value="all">Seluruh Indonesia</option>{boundaries.map((feature) => <option key={feature.slug} value={feature.slug}>{feature.name}</option>)}</select></label>
          <label className="has-label"><span>Sortir</span><select aria-label="Sortir titik" value={sort} onChange={(event) => setSort(event.target.value as NationalSort)}><option value="NAME_ASC">Nama lokasi (A–Z)</option><option value="AQI_ASC">ISPU terendah</option><option value="AQI_DESC">ISPU tertinggi</option></select></label>
          <label className="has-label"><span>Kepadatan titik</span><select aria-label="Jumlah titik simulasi" value={density} onChange={(event) => setDensity(Number(event.target.value))}>{POINT_DENSITIES.map((value) => <option key={value} value={value}>{value.toLocaleString("id-ID")} titik</option>)}</select></label>
          <label className="has-label"><span>Tampilan titik</span><select aria-label="Mode tampilan titik" value={pointMode} onChange={(event) => setPointMode(event.target.value as PointMode)}><option value="CLUSTER">Gabungan (cluster)</option><option value="INDIVIDUAL">Setiap titik</option></select></label>
        </div> : null}
      </div>
      <MapContainer center={[-2.2, 118]} zoom={4} minZoom={3} maxZoom={16} scrollWheelZoom className="leaflet-canvas" aria-label={`Peta ISPU nasional dengan ${visible.length} titik simulasi`}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <CaptureMap onReady={setMap} />
        <ResizeMapOnHeightChange height={panelHeight} />
        {pointMode === "CLUSTER" ? <ClusterLayer points={visible} selectedId={activePoint?.id ?? null} onSelect={selectPoint} /> : <IndividualLayer points={visible} selectedId={activePoint?.id ?? null} onSelect={selectPoint} />}
      </MapContainer>
      <div className="map-legend map-legend-inmap" aria-label="Legenda ISPU">{ISPU_BANDS.map((band) => <span key={band.name}><i style={{ background: band.color }} />{band.range} · {band.name}</span>)}</div>
    </div> : null}
    {citizen ? null : <div className="map-legend" aria-label="Legenda ISPU">{ISPU_BANDS.map((band) => <span key={band.name}><i style={{ background: band.color }} />{band.range} · {band.name}</span>)}</div>}
    {citizen ? null : stats ? <div className="ispu-summary" aria-live="polite">
      <div><dt>{selectedFeature ? selectedFeature.name : "Seluruh Indonesia"}</dt><dd>{stats.count.toLocaleString("id-ID")} titik</dd></div>
      <div><dt>Rata-rata</dt><dd>{stats.average} · {ispuLabel(stats.average)}</dd></div>
      <div><dt>Tertinggi</dt><dd>{stats.worst}</dd></div>
      <div><dt>Terendah</dt><dd>{stats.best}</dd></div>
    </div> : null}
    {citizen ? null : <div className="ispu-point-panel" style={{ height: panelHeight }}>
      {activePoint ? <div className="ispu-point-detail"><span className="status-dot" style={{ background: ispuColor(activePoint.aqi) }} /><div><p className="eyebrow">Titik dipilih</p><h3>{activePoint.name}</h3><p className="muted">{activePoint.province}</p></div><dl><div><dt>ISPU</dt><dd style={{ color: ispuColor(activePoint.aqi) }}>{activePoint.aqi}</dd></div><div><dt>Kategori</dt><dd>{ispuLabel(activePoint.aqi)}</dd></div><div><dt>Koordinat</dt><dd>{activePoint.lat}, {activePoint.lng}</dd></div></dl></div> : <div className="ispu-point-detail"><p className="muted">Pilih titik pada peta atau daftar di bawah untuk melihat detailnya.</p></div>}
      <div className="ispu-point-list" aria-label="Daftar titik sesuai sortir">{sorted.slice(0, 500).map((point) => <button key={point.id} className={activePoint?.id === point.id ? "is-selected" : ""} type="button" onClick={() => selectPoint(point)}><i aria-hidden style={{ background: ispuColor(point.aqi) }} /><span className="ispu-point-copy"><strong>{point.name}</strong><small>{point.province}</small></span><b>{point.aqi}</b></button>)}{sorted.length > 500 ? <p className="muted ispu-point-list-note">Menampilkan 500 dari {sorted.length.toLocaleString("id-ID")} titik. Perkecil filter provinsi untuk melihat semuanya.</p> : null}</div>
      <div className="ispu-resize-handle" role="separator" aria-orientation="horizontal" aria-label="Tarik untuk memperbesar atau memperkecil panel titik" onPointerDown={onResizeStart} onPointerMove={onResizeMove} onPointerUp={onResizeEnd} onPointerCancel={onResizeEnd}><span /></div>
    </div>}
  </section>;
}
