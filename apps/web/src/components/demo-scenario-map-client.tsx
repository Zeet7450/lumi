"use client";

import { Fragment, useEffect, useState } from "react";
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { projectDemoMap, type DemoMapProjection, type DemoScenario } from "@/lib/demo-scenario";
import { demoReferencePoint } from "@/lib/demo-locations";

type MapDetail = "fire" | "haze" | "wind";

const detailCopy: Record<MapDetail, { title: string; body: string }> = {
  fire: { title: "Titik api sintetis", body: "Titik api tetap untuk latihan kebakaran lahan Kalimantan." },
  haze: { title: "Area dampak asap", body: "Lingkaran menunjukkan proyeksi dampak kabut asap dari parameter Simulator." },
  wind: { title: "Arah angin", body: "Garis menunjukkan arah sebaran data uji dari titik api." }
};

function FitDemoBounds({ map }: { map: DemoMapProjection }) {
  const leafletMap = useMap();
  useEffect(() => {
    const radiusInDegrees = map.hazeRadiusMeters / 111_320;
    const longitudeRadius = radiusInDegrees / Math.cos(map.fire[0] * Math.PI / 180);
    const padding = .025;
    leafletMap.fitBounds([
      [Math.min(map.fire[0] - radiusInDegrees, map.windEnd[0]) - padding, Math.min(map.fire[1] - longitudeRadius, map.windEnd[1]) - padding],
      [Math.max(map.fire[0] + radiusInDegrees, map.windEnd[0]) + padding, Math.max(map.fire[1] + longitudeRadius, map.windEnd[1]) + padding]
    ], { padding: [28, 28], maxZoom: 12, animate: false });
  }, [leafletMap, map.fire, map.hazeRadiusMeters, map.windEnd]);
  return null;
}

export default function DemoScenarioMapClient({ scenario, surface }: { scenario: DemoScenario; surface: "SIMULATOR" | "OPERATIONS" }) {
  const map = projectDemoMap(scenario);
  const [detail, setDetail] = useState<MapDetail>("fire");
  const current = detailCopy[detail];
  const hazeOpacity = map.isActive ? 0.2 : 0.08;
  return <section className={`demo-scenario-map ${surface === "SIMULATOR" ? "is-simulator" : ""}`} aria-labelledby={`${surface.toLowerCase()}-map-title`}>
    <header className="demo-map-head"><div><p className="eyebrow">Peta skenario · Kalimantan Barat</p><h2 id={`${surface.toLowerCase()}-map-title`}>Titik api, dampak asap, dan angin</h2></div><span className="demo-map-state">{map.isActive ? "Skenario aktif" : "Template siap"}</span></header>
    <div className="demo-map-frame">
      <MapContainer center={map.center} zoom={10} minZoom={8} maxZoom={14} zoomControl scrollWheelZoom className="demo-map-canvas" aria-label="Peta interaktif skenario kebakaran lahan sintetis">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitDemoBounds map={map} />
        {scenario.simulation.sources.map((source) => { const point = demoReferencePoint(source.sourcePointId); return <Fragment key={source.id}><Circle center={point.coordinates} radius={source.radiusMeters} pathOptions={{ color: "#facc15", fillColor: "#fde68a", fillOpacity: map.isActive ? .13 : .05, weight: 1 }}><Tooltip sticky>Zona luar · {source.customName || (source.eventType === "HAZE" ? "Kabut asap" : "Kebakaran lahan")} · data uji</Tooltip></Circle><Circle center={point.coordinates} radius={source.radiusMeters * .62} pathOptions={{ color: "#f97316", fillColor: "#fb923c", fillOpacity: map.isActive ? .18 : .07, weight: 1 }} /><Circle center={point.coordinates} radius={source.radiusMeters * .3} pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: map.isActive ? .25 : .1, weight: 1 }} /><CircleMarker center={point.coordinates} radius={10} pathOptions={{ color: "#ffffff", fillColor: "#b91c1c", fillOpacity: 1, weight: 3 }} eventHandlers={{ click: () => setDetail("fire") }}><Tooltip permanent direction="top" offset={[0, -12]}>Sumber {source.customName || "data uji"}</Tooltip></CircleMarker></Fragment>; })}
        <Polyline positions={[map.fire, map.windEnd]} pathOptions={{ color: "#0f766e", weight: 3, dashArray: "8 8" }} eventHandlers={{ click: () => setDetail("wind") }}>
          <Tooltip sticky>Angin {map.windLabel}</Tooltip>
        </Polyline>
        <CircleMarker center={map.windEnd} radius={5} pathOptions={{ color: "#ffffff", fillColor: "#0f766e", fillOpacity: 1, weight: 2 }} eventHandlers={{ click: () => setDetail("wind") }} />
        <CircleMarker center={map.fire} radius={11} pathOptions={{ color: "#ffffff", fillColor: "#b91c1c", fillOpacity: 1, weight: 3 }} eventHandlers={{ click: () => setDetail("fire") }}>
          <Tooltip permanent direction="top" offset={[0, -12]}>Titik api · data uji</Tooltip>
        </CircleMarker>
      </MapContainer>
      <span className="demo-map-disclaimer">Overlay data uji · bukan informasi kejadian resmi</span>
    </div>
    <div className="demo-map-legend" aria-label="Legenda peta"><span><i className="fire" />Titik api</span><span><i className="haze" />Dampak asap</span><span><i className="wind" />Arah angin</span></div>
    <button type="button" className="demo-map-detail" onClick={() => setDetail(detail === "fire" ? "haze" : detail === "haze" ? "wind" : "fire")} aria-label="Tampilkan detail objek peta berikutnya">
      <span><strong>{current.title}</strong><small>{current.body}</small></span><b>{detail === "fire" ? "Dampak asap" : detail === "haze" ? "Arah angin" : "Titik api"}</b>
    </button>
    <dl className="demo-map-facts"><div><dt>Intensitas api</dt><dd>{map.fireIntensity}/5</dd></div><div><dt>Angin</dt><dd>{map.windLabel}</dd></div><div><dt>Radius dampak</dt><dd>{Math.round(map.hazeRadiusMeters / 1_000)} km</dd></div></dl>
  </section>;
}
