"use client";

import { useState } from "react";
import { Circle, CircleMarker, MapContainer, Polyline, Tooltip } from "react-leaflet";
import { projectDemoMap, type DemoScenario } from "@/lib/demo-scenario";

type MapDetail = "fire" | "haze" | "wind";

const detailCopy: Record<MapDetail, { title: string; body: string }> = {
  fire: { title: "Titik api sintetis", body: "Titik latihan tetap untuk demonstrasi kebakaran lahan Kalimantan." },
  haze: { title: "Area dampak asap", body: "Lingkaran menunjukkan proyeksi dampak kabut asap dari parameter Simulator." },
  wind: { title: "Arah angin", body: "Garis menunjukkan arah sebaran data uji dari titik api." }
};

export default function DemoScenarioMapClient({ scenario, surface }: { scenario: DemoScenario; surface: "SIMULATOR" | "OPERATIONS" }) {
  const map = projectDemoMap(scenario);
  const [detail, setDetail] = useState<MapDetail>("fire");
  const current = detailCopy[detail];
  const hazeOpacity = map.isActive ? 0.2 : 0.08;
  return <section className={`demo-scenario-map ${surface === "SIMULATOR" ? "is-simulator" : ""}`} aria-labelledby={`${surface.toLowerCase()}-map-title`}>
    <header className="demo-map-head"><div><p className="eyebrow">Peta skenario · Kalimantan Barat</p><h2 id={`${surface.toLowerCase()}-map-title`}>Titik api, dampak asap, dan angin</h2></div><span className="demo-map-state">{map.isActive ? "Skenario aktif" : "Template siap"}</span></header>
    <div className="demo-map-frame">
      <MapContainer center={map.center} zoom={11} minZoom={9} maxZoom={14} zoomControl scrollWheelZoom className="demo-map-canvas" aria-label="Peta interaktif skenario kebakaran lahan sintetis">
        <Circle center={map.fire} radius={map.hazeRadiusMeters} pathOptions={{ color: "#d97706", fillColor: "#f59e0b", fillOpacity: hazeOpacity, weight: 1.5 }} eventHandlers={{ click: () => setDetail("haze") }}>
          <Tooltip sticky>Area dampak asap sintetis</Tooltip>
        </Circle>
        <Polyline positions={[map.fire, map.windEnd]} pathOptions={{ color: "#0f766e", weight: 3, dashArray: "8 8" }} eventHandlers={{ click: () => setDetail("wind") }}>
          <Tooltip sticky>Angin {map.windLabel}</Tooltip>
        </Polyline>
        <CircleMarker center={map.windEnd} radius={5} pathOptions={{ color: "#ffffff", fillColor: "#0f766e", fillOpacity: 1, weight: 2 }} eventHandlers={{ click: () => setDetail("wind") }} />
        <CircleMarker center={map.fire} radius={11} pathOptions={{ color: "#ffffff", fillColor: "#b91c1c", fillOpacity: 1, weight: 3 }} eventHandlers={{ click: () => setDetail("fire") }}>
          <Tooltip permanent direction="top" offset={[0, -12]}>Titik api · data uji</Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
    <div className="demo-map-legend" aria-label="Legenda peta"><span><i className="fire" />Titik api</span><span><i className="haze" />Dampak asap</span><span><i className="wind" />Arah angin</span></div>
    <button type="button" className="demo-map-detail" onClick={() => setDetail(detail === "fire" ? "haze" : detail === "haze" ? "wind" : "fire")} aria-label="Tampilkan detail objek peta berikutnya">
      <span><strong>{current.title}</strong><small>{current.body}</small></span><b>{detail === "fire" ? "Dampak asap" : detail === "haze" ? "Arah angin" : "Titik api"}</b>
    </button>
    <dl className="demo-map-facts"><div><dt>Intensitas api</dt><dd>{map.fireIntensity}/5</dd></div><div><dt>Angin</dt><dd>{map.windLabel}</dd></div><div><dt>Radius dampak</dt><dd>{Math.round(map.hazeRadiusMeters / 1_000)} km</dd></div></dl>
  </section>;
}
