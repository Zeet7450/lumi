"use client";

import dynamic from "next/dynamic";

const OperationalMapClient = dynamic(() => import("./operational-map-client").then((module) => module.OperationalMapClient), {
  ssr: false,
  loading: () => <section className="operational-map" aria-busy="true"><div className="workflow-empty"><strong>Memuat peta operasional</strong><span>Menyiapkan visualisasi data sintetis.</span></div></section>
});

export function OperationalMap() {
  return <OperationalMapClient />;
}
