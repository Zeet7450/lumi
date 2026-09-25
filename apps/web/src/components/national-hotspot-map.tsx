"use client";

import dynamic from "next/dynamic";

const NationalHotspotMapClient = dynamic(() => import("./national-hotspot-map-client"), {
  ssr: false,
  loading: () => <section className="command-panel map-loading" aria-busy="true">Memuat peta hotspot nasional…</section>
});

export function NationalHotspotMap() {
  return <NationalHotspotMapClient />;
}
