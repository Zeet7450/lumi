"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTime, getDashboard, tierLabel, type DashboardData, type Tier } from "@/lib/lumi";
import { OpsMap } from "./ops-map";

function tierClass(tier: Tier | null) { return tier === "HIGH_RESPONSE" ? "tier-high" : tier === "VERIFY" ? "tier-verify" : "tier-monitor"; }

function TrendChart({ data, selectedRegion }: { data: DashboardData["trend"]; selectedRegion: string }) {
  const points = data.filter((point) => selectedRegion === "all" || point.regionSlug === selectedRegion);
  const values = points.map((point) => point.pm25);
  const max = Math.max(80, ...values);
  const min = Math.min(0, ...values);
  const chartY = (value: number) => 92 - ((value - min) / Math.max(1, max - min)) * 70;
  const thresholdY = chartY(55.5);
  const line = points.map((point, index) => {
    const x = points.length <= 1 ? 50 : 16 + (index / (points.length - 1)) * 268;
    const y = chartY(point.pm25);
    return `${x},${y}`;
  }).join(" ");
  const latest = points.at(-1);
  return <section className="command-panel chart-panel" aria-labelledby="pm25-trend-title">
    <div className="panel-head"><div><p className="eyebrow">24 pembaruan terakhir</p><h2 id="pm25-trend-title">Tren PM2.5</h2></div><span className="chart-unit">µg/m³</span></div>
    <div className="chart-wrap" role="img" aria-label={latest ? `Tren PM2.5. Nilai terakhir ${latest.pm25} mikrogram per meter kubik.` : "Belum ada data tren."}>
      <svg viewBox="0 0 300 110" preserveAspectRatio="none" aria-hidden="true">
        <path className="chart-grid" d="M16 22H284M16 57H284M16 92H284" />
        <path className="chart-threshold" d={`M16 ${thresholdY}H284`} />
        {line ? <><polyline className="chart-area" points={`16,92 ${line} 284,92`} /><polyline className="chart-line" points={line} /></> : null}
        {latest ? <circle className="chart-dot" cx={points.length <= 1 ? 50 : 284} cy={chartY(latest.pm25)} r="4" /> : null}
      </svg>
      <div className="chart-scale"><span>{max}</span><span>55.5 ambang verifikasi</span><span>0</span></div>
    </div>
    <p className="chart-insight">{latest ? <><strong>{latest.pm25} µg/m³</strong> pembaruan terakhir. Garis putus-putus menandai ambang verifikasi.</> : "Belum ada data yang masuk."}</p>
  </section>;
}

export function OpsDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData>();
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [error, setError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try { const next = await getDashboard(); if (mounted) { setDashboard(next); setError(false); } }
      catch { if (mounted) setError(true); }
    };
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 7_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [retryNonce]);
  const regionOptions = useMemo(() => dashboard?.regions ?? [], [dashboard]);
  if (!dashboard && error) return <section className="dashboard-loading dashboard-unavailable" role="alert"><p className="eyebrow">Pusat data belum terhubung</p><h1>Dashboard belum dapat dimuat</h1><p className="muted">Pastikan layanan backend LUMI berjalan, lalu coba hubungkan kembali.</p><button className="button" type="button" onClick={() => { setError(false); setRetryNonce((value) => value + 1); }}>Coba lagi</button></section>;
  if (!dashboard) return <section className="dashboard-loading" aria-busy="true"><p className="eyebrow">Membuka pusat kendali</p><h1>Memuat dashboard operasional…</h1><p className="muted">Menghubungkan ke pusat data LUMI.</p></section>;
  return <>
    <header className="command-header"><div><p className="eyebrow">LUMI Operations</p><h1>Situational awareness</h1><p className="muted">Pantau perubahan kualitas udara, alasan prioritas, dan pekerjaan lintas instansi dalam satu layar.</p></div><div className="last-sync"><span className="live-pulse" />Data terakhir<br /><strong>{formatTime(dashboard.updatedAt)}</strong></div></header>
    {error ? <p className="preview">Koneksi pembaruan terputus. Nilai terakhir tetap ditampilkan.</p> : null}
    <section className="kpi-grid" aria-label="Ringkasan operasional">
      <article className="kpi-card"><span>Wilayah dipantau</span><strong>{dashboard.kpis.monitoredRegions}</strong><small>pemantauan aktif</small></article>
      <article className="kpi-card is-danger"><span>Respons tinggi</span><strong>{dashboard.kpis.highResponse}</strong><small>butuh koordinasi BPBD</small></article>
      <article className="kpi-card is-warn"><span>Perlu verifikasi</span><strong>{dashboard.kpis.verification}</strong><small>butuh cek lanjutan DLH</small></article>
      <article className="kpi-card"><span>Insiden terbuka</span><strong>{dashboard.kpis.openIncidents}</strong><small>belum ditutup</small></article>
    </section>
    <section className="command-grid"><OpsMap points={dashboard.mapPoints} /><TrendChart data={dashboard.trend} selectedRegion={selectedRegion} /></section>
    <section className="command-panel region-table"><div className="panel-head"><div><p className="eyebrow">Data masuk</p><h2>Wilayah yang dipantau</h2></div><label className="compact-select">Tampilan grafik<select value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}><option value="all">Semua wilayah</option>{regionOptions.map((region) => <option key={region.slug} value={region.slug}>{region.name}</option>)}</select></label></div><div className="table-scroll"><table><thead><tr><th>Wilayah</th><th>PM2.5</th><th>AQI</th><th>Status prioritas</th><th>Pembaruan terakhir</th></tr></thead><tbody>{dashboard.regions.map((region) => <tr key={region.slug}><td><strong>{region.name}</strong><small>{region.province}</small></td><td className="numeric">{region.pm25 ?? "–"}<small>µg/m³</small></td><td className="numeric">{region.aqi ?? "–"}<small>AQI</small></td><td><span className={`badge ${tierClass(region.tier)}`}>{region.tier ? tierLabel(region.tier) : "Menunggu data"}</span></td><td>{formatTime(region.observedAt)}</td></tr>)}</tbody></table></div></section>
  </>;
}
