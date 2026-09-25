"use client";

import { useEffect, useMemo, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Circle, CircleMarker, MapContainer, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";
import { ISPU_BANDS, ispuColor, ispuLabel } from "@/lib/ispu";
import type { DashboardData } from "@/lib/lumi";

type Point = DashboardData["mapPoints"][number];
const bands = ISPU_BANDS.map((band) => [band.range, band.color, `${band.name} ${band.range}`] as const);
function hazardLabel(type: string) { return type === "FIRE" ? "Api" : type === "VOLCANIC_ASH" ? "Abu vulkanik" : type === "FLOOD" ? "Banjir" : "Indikasi"; }
function HazardGlyph({ type }: { type: string }) {
  if (type === "FIRE") return <svg className="hazard-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c2 4-1 5 2 8 1-2 3-3 3-6 3 3 4 6 4 9a9 9 0 0 1-18 0c0-3 2-6 5-9 0 3 1 4 4-2Z" /></svg>;
  if (type === "VOLCANIC_ASH") return <svg className="hazard-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 19 8-14a1.2 1.2 0 0 1 2 0l8 14M8 14h8M10 10h4M4 21h16" /></svg>;
  return <svg className="hazard-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9c2 2 4 2 6 0s4-2 6 0 4 2 6 0M3 15c2 2 4 2 6 0s4-2 6 0 4 2 6 0" /></svg>;
}
function boundaryCoordinates(point: Point): [number, number][] {
  if (!point.administrativeBoundary || point.administrativeBoundary.type !== "Polygon") return [];
  const rings = point.administrativeBoundary.coordinates as number[][][];
  return (rings[0] ?? []).map(([longitude, latitude]) => [latitude!, longitude!] as [number, number]);
}
function CaptureMap({ onReady }: { onReady: (map: LeafletMap) => void }) { const map = useMap(); useEffect(() => { onReady(map); }, [map, onReady]); return null; }
function FocusSelection({ point }: { point: Point | undefined }) { const map = useMap(); useEffect(() => { if (point) map.setView([point.latitude, point.longitude], 9, { animate: true }); }, [map, point]); return null; }

export default function OpsMapClient({ points }: { points: Point[] }) {
  const [selected, setSelected] = useState<Point | undefined>(points[0]);
  const [map, setMap] = useState<LeafletMap>();
  const [showRadius, setShowRadius] = useState(true);
  const [province, setProvince] = useState("all");
  const visible = useMemo(() => points.filter((point) => province === "all" || point.provinceSlug === province), [points, province]);
  const provinceOptions = useMemo(() => [...new Map(points.map((point) => [point.provinceSlug, point.province])).entries()], [points]);
  useEffect(() => { if (selected && !visible.some((point) => point.id === selected.id)) setSelected(visible[0]); }, [visible, selected]);
  const toggleFullscreen = () => { const frame = map?.getContainer().parentElement; if (!frame) return; if (document.fullscreenElement) void document.exitFullscreen(); else void frame.requestFullscreen(); };
  const showAll = () => { if (map && visible.length) map.fitBounds(visible.map((point) => [point.latitude, point.longitude] as [number, number]), { padding: [32, 32], maxZoom: 7 }); };
  return <section className="command-panel live-map" aria-labelledby="risk-map-title">
    <div className="panel-head"><div><p className="eyebrow">Sebaran kabupaten/kota</p><h2 id="risk-map-title">Peta AQI & indikasi risiko</h2></div><span className="map-live">{visible.length} wilayah</span></div>
    <div className="map-tool-row"><div className="layer-controls"><label>Provinsi<select aria-label="Filter provinsi peta" value={province} onChange={(event) => setProvince(event.target.value)}><option value="all">Seluruh Kalimantan</option>{provinceOptions.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}</select></label><label><input type="checkbox" checked={showRadius} onChange={(event) => setShowRadius(event.target.checked)} /> Radius dampak</label></div><button className="map-text-action" type="button" onClick={showAll}>Lihat seluruh wilayah</button></div>
    <div className="leaflet-frame"><button className="map-fullscreen" type="button" onClick={toggleFullscreen} aria-label="Buka peta layar penuh" title="Layar penuh"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m13-5v4a1 1 0 0 1-1 1h-4" /></svg></button><MapContainer center={[-1.12, 114.2]} zoom={5} minZoom={4} maxZoom={16} scrollWheelZoom className="leaflet-canvas" aria-label="Peta interaktif kualitas udara Kalimantan"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><CaptureMap onReady={setMap} /><FocusSelection point={selected} />
      {visible.map((point) => { const coords = boundaryCoordinates(point); return coords.length >= 3 ? <Polygon key={`${point.id}-boundary`} positions={coords} pathOptions={{ color: ispuColor(point.aqi), fillColor: ispuColor(point.aqi), fillOpacity: .12, weight: selected?.id === point.id ? 2 : 1 }} eventHandlers={{ click: () => setSelected(point) }} /> : null; })}
      {showRadius && visible.filter((point) => point.pm25 !== null).map((point) => <Circle key={`${point.id}-radius`} center={[point.latitude, point.longitude]} radius={point.radiusKm * 1000} pathOptions={{ color: ispuColor(point.aqi), fillColor: ispuColor(point.aqi), fillOpacity: selected?.id === point.id ? .16 : .07, weight: selected?.id === point.id ? 2 : 1 }} eventHandlers={{ click: () => setSelected(point) }} />)}
      {visible.map((point) => <CircleMarker key={point.id} center={[point.latitude, point.longitude]} radius={selected?.id === point.id ? 10 : 7} pathOptions={{ color: "#FFFFFF", fillColor: ispuColor(point.aqi), fillOpacity: 1, weight: 2.5 }} eventHandlers={{ click: () => setSelected(point) }}><Tooltip direction="top" offset={[0, -8]}>{point.city} · {point.aqi === null ? "menunggu data" : `AQI ${point.aqi}`}</Tooltip></CircleMarker>)}</MapContainer></div>
    <div className="map-legend" aria-label="Legenda AQI">{bands.map(([, color, text]) => <span key={text}><i style={{ background: color }} />{text}</span>)}<span><i style={{ background: "#8793A4" }} />Belum ada data</span></div>
    <p className="map-caption">Warna titik menunjukkan AQI. Ikon kejadian di panel detail tidak mengubah warna AQI. Batas kabupaten/kota tampil setelah data batas administratif tersinkronkan.</p>
    {selected ? <div className="map-detail" aria-live="polite"><span className="status-dot" style={{ background: ispuColor(selected.aqi) }} /><div className="map-detail-body"><div className="map-detail-heading"><div><strong>{selected.city}</strong><p>{selected.province} · {selected.district}</p></div><span className="badge">{ispuLabel(selected.aqi)}</span></div><dl className="risk-facts"><div><dt>AQI</dt><dd>{selected.aqi ?? "–"}</dd></div><div><dt>PM2.5</dt><dd>{selected.pm25 === null ? "–" : `${selected.pm25} µg/m³`}</dd></div><div><dt>Radius</dt><dd>{selected.pm25 === null ? "–" : `${selected.radiusKm} km`}</dd></div><div><dt>Pembaruan</dt><dd>{selected.observedAt ? new Intl.DateTimeFormat("id-ID", { timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(selected.observedAt)) + " WIB" : "Menunggu data"}</dd></div></dl>{selected.hazards.length ? <div className="hazard-list" aria-label="Indikasi kejadian">{selected.hazards.map((hazard) => <span key={`${hazard.type}-${hazard.severity}`}><HazardGlyph type={hazard.type} />{hazardLabel(hazard.type)} · tingkat {hazard.severity}</span>)}</div> : <small>Tidak ada indikasi kejadian dari telemetri terbaru.</small>}</div></div> : <p className="muted">Belum ada titik pemantauan.</p>}
    <div className="map-location-list" aria-label="Daftar wilayah peta">{visible.map((point) => <button key={`select-${point.id}`} className={selected?.id === point.id ? "is-selected" : ""} type="button" onClick={() => setSelected(point)}><span style={{ background: ispuColor(point.aqi) }} />{point.city}<strong>{point.aqi === null ? "–" : `AQI ${point.aqi}`}</strong></button>)}</div>
  </section>;
}
