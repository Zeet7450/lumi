"use client";

import { useState } from "react";
import { FIRE_INTENSITIES, WIND_DIRECTIONS, WIND_SPEEDS, type DemoCommandInput, type FireIntensity, type WindDirection, type WindSpeed } from "@/lib/demo-scenario";
import { useDemoScenario } from "./demo-scenario-store";
import { DemoScenarioMap } from "./demo-scenario-map";

export function SimulationCenter() {
  const { scenario, role, run } = useDemoScenario();
  const [error, setError] = useState("");
  const command = (next: DemoCommandInput) => {
    try { setError(""); run(next); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Tindakan demo tidak dapat dijalankan."); }
  };
  const canControl = role === "SIMULATOR" && (scenario.workflow === "READY" || scenario.workflow === "ENVIRONMENT_PENDING");
  const canPlay = role === "SIMULATOR" && (scenario.workflow === "READY" || (scenario.workflow === "ENVIRONMENT_PENDING" && !scenario.simulation.isPlaying));
  const canPause = role === "SIMULATOR" && scenario.workflow === "ENVIRONMENT_PENDING" && scenario.simulation.isPlaying;
  const play = () => command({ type: scenario.workflow === "READY" ? "CREATE_SCENARIO" : "PLAY_SIMULATION" });
  return <div className="workflow-console">
    <header className="simulator-intro"><div><p className="eyebrow">Template aktif · Kalimantan</p><h1>Kebakaran lahan & asap</h1><p>Ruang uji lokal untuk membuat satu skenario sintetis. Perubahan tampil pada tab yang sama atau browser lain di perangkat ini.</p></div><span className="workflow-state">{scenario.workflow.replaceAll("_", " ")}</span></header>
    <section className="workflow-scenario-card"><div><p className="eyebrow">Sumber data</p><h2>{scenario.createdAt ? "Skenario sintetis sedang berjalan" : "Skenario belum dibuat"}</h2><p>{scenario.observation?.summary ?? "Mulai skenario untuk memasukkan sinyal hotspot dan kabut asap data uji."}</p></div><div className="workflow-facts"><span>Lokasi<strong>{scenario.region.name}</strong></span><span>AQI<strong>{scenario.observation?.aqi ?? "–"}</strong></span><span>PM2.5<strong>{scenario.observation ? `${scenario.observation.pm25} µg/m³` : "–"}</strong></span><span>Angin<strong>{scenario.observation?.wind ?? "–"}</strong></span></div></section>
    <DemoScenarioMap surface="SIMULATOR" />
    <section className="workflow-actions" aria-labelledby="sim-actions-title"><div><p className="eyebrow">Kontrol Simulator</p><h2 id="sim-actions-title">Jalankan parameter data uji</h2><p>Hanya peran Simulator yang dapat menjalankan, menjeda, mereset, atau menyesuaikan parameter sebelum validasi DLH.</p></div><div className="button-row"><button className="button sim-primary" type="button" onClick={play} disabled={!canPlay}>Play</button><button className="button sim-reset" type="button" onClick={() => command({ type: "PAUSE_SIMULATION" })} disabled={!canPause}>Pause</button><button className="button sim-reset" type="button" onClick={() => command({ type: "RESET_SCENARIO" })} disabled={role !== "SIMULATOR" || scenario.workflow === "READY"}>Reset</button></div>
      <div className="simulation-controls"><label>Arah angin<select aria-label="Arah angin" value={scenario.simulation.windDirection} disabled={!canControl} onChange={(event) => command({ type: "SET_WIND_DIRECTION", windDirection: event.target.value as WindDirection })}>{WIND_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{direction}</option>)}</select></label><label>Kecepatan angin<select aria-label="Kecepatan angin" value={scenario.simulation.windSpeed} disabled={!canControl} onChange={(event) => command({ type: "SET_WIND_SPEED", windSpeed: Number(event.target.value) as WindSpeed })}>{WIND_SPEEDS.map((speed) => <option key={speed} value={speed}>{speed} km/jam</option>)}</select></label><label>Intensitas api<select aria-label="Intensitas api" value={scenario.simulation.fireIntensity} disabled={!canControl} onChange={(event) => command({ type: "SET_FIRE_INTENSITY", fireIntensity: Number(event.target.value) as FireIntensity })}>{FIRE_INTENSITIES.map((intensity) => <option key={intensity} value={intensity}>{intensity}/5</option>)}</select></label></div>{role !== "SIMULATOR" && <p className="preview">Pilih peran Simulator pada selector demo lokal untuk menjalankan kontrol ini.</p>}{error && <p className="error" role="alert">{error}</p>}</section>
  </div>;
}
