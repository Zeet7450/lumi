"use client";

import dynamic from "next/dynamic";
import type { CitizenPoint } from "@/lib/citizen-points";

const WargaHeroMapClient = dynamic(() => import("./warga-hero-map-client"), {
  ssr: false,
  loading: () => <div className="warga-map-loading" aria-live="polite"><span>LUMI</span><p>Menyiapkan peta cakupan</p></div>
});

export function WargaHeroMap({ points }: { points: CitizenPoint[] }) { return <WargaHeroMapClient points={points} />; }
