"use client";

import dynamic from "next/dynamic";
import type { DashboardData } from "@/lib/lumi";

const OpsMapClient = dynamic(() => import("./ops-map-client"), { ssr: false, loading: () => <section className="command-panel map-loading">Memuat peta interaktif…</section> });
export function OpsMap({ points }: { points: DashboardData["mapPoints"] }) { return <OpsMapClient points={points} />; }
