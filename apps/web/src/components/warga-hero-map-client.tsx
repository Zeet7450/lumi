"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { INDONESIA_BOUNDS, pointStatusColor, type CitizenPoint } from "@/lib/citizen-points";
import { GridClusterLayer } from "./grid-cluster-layer";

type StatusFn = (point: CitizenPoint) => "idle" | "watch" | "alert";

/**
 * Frames Indonesia once the map mounts. The frame is a responsive grid column,
 * so its final width is not known at mount; observe the frame and re-fit so the
 * framing is stable at every breakpoint. Zoom stays an implementation detail of
 * the bounds — no Kalimantan-specific viewport is hard-coded.
 */
function IndonesiaBounds() {
  const map = useMap();
  useEffect(() => {
    const frame = map.getContainer();
    let pending = 0;
    const fit = () => {
      window.cancelAnimationFrame(pending);
      pending = window.requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
        map.fitBounds(INDONESIA_BOUNDS, { padding: [8, 8], animate: false });
      });
    };
    fit();
    if (typeof ResizeObserver === "undefined") return () => window.cancelAnimationFrame(pending);
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    return () => { observer.disconnect(); window.cancelAnimationFrame(pending); };
  }, [map]);
  return null;
}

/**
 * Clustering via Leaflet.markercluster. The national frame is the point: at
 * national zoom the Kalimantan points collapse into a few clusters, and as the
 * catalogue grows the clusters multiply. Citizen rule: a group of 15 or fewer
 * points NEVER clusters, it always shows its individual locations, so warga
 * never has to zoom deep to see each one.
 */
function ClusterLayer({ points, statusOf, onSelect }: { points: CitizenPoint[]; statusOf: StatusFn; onSelect: (point: CitizenPoint) => void }) {
  return <GridClusterLayer
    points={points}
    pointId={(point) => point.id}
    onSelect={onSelect}
    createMarker={(point) => {
      const color = pointStatusColor(statusOf(point));
      const marker = L.circleMarker([point.lat, point.lng], { radius: 6, color: "#ffffff", weight: 1.5, fillColor: color, fillOpacity: 1 });
      marker.bindTooltip(`${point.name} · ${point.province}`, { direction: "top", offset: [0, -8] });
      return marker;
    }}
    clusterIcon={(count) => L.divIcon({ className: "warga-dot-cluster", html: `<span>${count}</span>`, iconSize: [40, 40] })}
  />;
}

export default function WargaHeroMapClient({ points }: { points: CitizenPoint[] }) {
  // Status scheme is not finalised: every point starts "idle" and the scale is
  // one swappable table in citizen-points.ts. The function shape keeps the
  // eventual live status wiring (bridge/Supabase) a drop-in change.
  const statusOf = useMemo<StatusFn>(() => () => "idle", []);
  return <div className="warga-map-frame">
    <MapContainer center={[-2.5, 118]} zoom={4} minZoom={3} maxZoom={10} zoomControl={false} attributionControl className="warga-map-canvas" aria-label={`Peta Indonesia dengan ${points.length} titik pemantauan`}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <IndonesiaBounds />
      {points.length ? <ClusterLayer points={points} statusOf={statusOf} onSelect={() => undefined} /> : null}
    </MapContainer>
    {points.length ? <aside className="warga-map-card"><strong>Cakupan aktif</strong><span>{new Set(points.map((point) => point.provinceSlug)).size} provinsi · {points.length} titik</span><small>Peta interaktif</small></aside> : <aside className="warga-map-card"><strong>Cakupan aktif</strong><span>Menunggu data</span><small>Katalog titik belum terhubung</small></aside>}
  </div>;
}
