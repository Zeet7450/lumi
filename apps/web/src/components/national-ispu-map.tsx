"use client";

import dynamic from "next/dynamic";

const NationalIspuMapClient = dynamic(() => import("./national-ispu-map-client"), {
  ssr: false,
  loading: () => <section className="command-panel map-loading" aria-busy="true">Memuat peta ISPU nasional…</section>
});

/** `citizen` trims the map to the in-map experience only: legend bottom-left, options behind the map's own menu button. */
export function NationalIspuMap({ citizen = false }: { citizen?: boolean }) {
  return <NationalIspuMapClient citizen={citizen} />;
}
