"use client";

import dynamic from "next/dynamic";
import { useDemoScenario } from "./demo-scenario-store";

const DemoScenarioMapClient = dynamic(() => import("./demo-scenario-map-client"), {
  ssr: false,
  loading: () => <section className="demo-map-loading" aria-live="polite">Menyiapkan peta skenario sintetis…</section>
});

export function DemoScenarioMap({ surface }: { surface: "SIMULATOR" | "OPERATIONS" }) {
  const { scenario } = useDemoScenario();
  return <DemoScenarioMapClient scenario={scenario} surface={surface} />;
}
