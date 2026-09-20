"use client";

import { useDemoScenario } from "./demo-scenario-store";

export function SimulationModeBanner() {
  const { isReady } = useDemoScenario();
  return <aside className="simulation-mode-banner" aria-label="Status mode simulasi"><strong>SIMULATION MODE — Data uji, bukan kondisi nyata.</strong><span>{isReady ? "Tersimpan dan tersinkron pada browser/perangkat ini saja." : "Menyiapkan state demo lokal…"}</span></aside>;
}
