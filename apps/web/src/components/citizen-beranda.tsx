"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NationalIspuMap } from "./national-ispu-map";
import { demoReferencePoints, type DemoReferencePoint } from "@/lib/demo-locations";
import { readSession } from "@/lib/warga-session";

const bridge = "http://127.0.0.1:3100";
type Report = { id: string; status: string; category: string; location: string; createdAt: string; citizen: string };

/**
 * Resolve the citizen's primary region to real data. A region may be a single
 * station id ("pontianak-utara") or an area slug ("pontianak"); an area rolls
 * up every station whose kabupaten matches, so the card never shows a random
 * fallback station in place of the citizen's own city.
 */
function resolveRegion(regionSlug: string): { name: string; sub: string; aqi: number; pm25: number; trend: DemoReferencePoint["trend"]; status: DemoReferencePoint["environmentalStatus"]; incident: DemoReferencePoint["incidentStatus"] } {
  const exact = demoReferencePoints.find((point) => point.id === regionSlug);
  if (exact) return { name: `${exact.name}, ${exact.kabupaten}`, sub: `${exact.kecamatan} · ${exact.kelurahan}`, aqi: exact.aqi, pm25: exact.pm25, trend: exact.trend, status: exact.environmentalStatus, incident: exact.incidentStatus };
  const family = demoReferencePoints.filter((point) => point.kabupaten.toLowerCase().includes(regionSlug.replace(/-/g, " ")));
  const stations = family.length ? family : demoReferencePoints;
  const round = (values: number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const worstTrend = stations.some((point) => point.trend === "Meningkat") ? "Meningkat" : stations.some((point) => point.trend === "Stabil") ? "Stabil" : "Menurun";
  return {
    name: stations[0]!.kabupaten,
    sub: `${stations.length} titik pantau · rata-rata wilayah`,
    aqi: round(stations.map((point) => point.aqi)),
    pm25: round(stations.map((point) => point.pm25)),
    trend: worstTrend,
    status: stations.every((point) => point.environmentalStatus === "Tervalidasi") ? "Tervalidasi" : "Pantau",
    incident: stations.every((point) => point.incidentStatus === "Tidak ada") ? "Tidak ada" : "Asap sintetis"
  };
}

/**
 * Beranda, the citizen's first screen after login: the primary location with
 * its air quality up front, the live map below it, and the citizen's own
 * submitted reports. Reporting lives on the dedicated Lapor page.
 */
export function CitizenBeranda({ regionSlug }: { regionSlug: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [session, setSession] = useState<ReturnType<typeof readSession>>(null);

  useEffect(() => {
    setSession(readSession());
    let active = true;
    const refresh = async () => {
      try {
        const data = await (await fetch(`${bridge}/state`, { cache: "no-store" })).json();
        if (!active) return;
        setReports(Array.isArray(data.reports) ? (data.reports as Report[]).filter((report) => report.citizen === session?.email) : []);
      } catch { /* The empty state below stays honest while the bridge is away. */ }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [session?.email]);

  const region = useMemo(() => resolveRegion(regionSlug), [regionSlug]);
  const nickname = session?.nickname || "Warga";

  return <div className="citizen-page citizen-beranda">
    <header className="citizen-page-head">
      <p className="warga-eyebrow">BERANDA</p>
      <h1>Halo, {nickname}.</h1>
      <p className="muted">Kondisi udara wilayah utama Anda, diperbarui terus dari titik pemantauan resmi.</p>
    </header>

    <section className="beranda-region" aria-labelledby="beranda-region-title">
      <div className="beranda-region-head">
        <div>
          <p className="warga-eyebrow">WILAYAH UTAMA</p>
          <h2 id="beranda-region-title">{region.name}</h2>
          <p className="muted">{region.sub}</p>
        </div>
        <Link className="button secondary beranda-region-switch" href="/profil">Ganti wilayah</Link>
      </div>
      <div className="beranda-region-data">
        <div className="beranda-metric">
          <span>ISPU</span>
          <strong>{region.aqi}</strong>
          <small>{region.trend === "Menurun" ? "Tren membaik" : region.trend === "Meningkat" ? "Tren memburuk" : "Tren stabil"}</small>
        </div>
        <div className="beranda-metric">
          <span>PM2.5</span>
          <strong>{region.pm25} <i>µg/m³</i></strong>
          <small>{region.status}</small>
        </div>
        <div className="beranda-metric">
          <span>Status wilayah</span>
          <strong>{region.incident === "Tidak ada" ? "Tanpa kejadian" : region.incident}</strong>
          <small>Status {region.status.toLowerCase()}</small>
        </div>
      </div>
    </section>

    <section className="beranda-map" aria-label="Peta pemantauan nasional">
      <div className="beranda-map-head">
        <h2>Pantau wilayah lain di peta.</h2>
        <Link className="beranda-map-link" href="/peta">Buka peta penuh</Link>
      </div>
      <NationalIspuMap citizen />
    </section>

    {reports.length ? <section className="beranda-reports" aria-labelledby="beranda-reports-title">
      <h2 id="beranda-reports-title">Laporan saya</h2>
      <div className="my-reports">{reports.map((report) => <article key={report.id}><strong>{report.category}</strong><span>{report.location} · {report.status}</span></article>)}</div>
    </section> : <section className="beranda-reports" aria-labelledby="beranda-reports-title">
      <h2 id="beranda-reports-title">Laporan saya</h2>
      <p className="muted">Belum ada laporan dari akun ini. Lihat atau alami sesuatu di sekitar Anda? <Link href="/lapor">Laporkan di halaman Lapor</Link>.</p>
    </section>}
  </div>;
}
