"use client";

import { useEffect, useMemo, useState } from "react";
import { demoReferencePoints } from "@/lib/demo-locations";

const bridge = "http://127.0.0.1:3100";

type CitizenReport = {
  id: string;
  createdAt: string;
  status: string;
  category: string;
  location: string;
  province?: string;
  description: string;
  citizen: string;
  images: string[];
  queue: string;
  queueLabel?: string;
};

/** Human name for a stored location id or area slug, e.g. "pontianak" -> "Kota Pontianak". */
function locationLabel(id: string): string {
  const station = demoReferencePoints.find((point) => point.id === id);
  if (station) return `${station.name}, ${station.kabupaten}`;
  const area = demoReferencePoints.find((point) => id.replace(/-/g, " ").includes(point.kabupaten.toLowerCase()) || point.kabupaten.toLowerCase().includes(id.replace(/-/g, " ")));
  return area?.kabupaten ?? id;
}

/**
 * Citizen report inbox for a provincial command center. Reports are routed by
 * province at submit time, so this board filters the shared queue down to the
 * session's own province and never shows another province's reports.
 */
export function CitizenReportsBoard({ province }: { province: string }) {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [connection, setConnection] = useState<"ok" | "down">("ok");

  useEffect(() => {
    let active = true;
    const pull = async () => {
      try {
        const data = await (await fetch(`${bridge}/state`, { cache: "no-store" })).json();
        if (!active) return;
        setReports(Array.isArray(data.reports) ? (data.reports as CitizenReport[]) : []);
        setConnection("ok");
      } catch {
        if (active) setConnection("down");
      }
      if (active) setLoaded(true);
    };
    void pull();
    const timer = window.setInterval(() => void pull(), 5_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const mine = useMemo(() => reports
    .filter((report) => (report.province ?? "Kalimantan Barat") === province)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [reports, province]);

  const waiting = mine.filter((report) => report.status === "Menunggu verifikasi").length;

  const formatDate = (iso: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso));

  return <section className="workflow-board">
    <header className="ops-header">
      <div>
        <p className="eyebrow">Laporan warga · {province}</p>
        <h1>Laporan Warga</h1>
        <p className="muted">Laporan kondisi lapangan yang dikirim warga lewat portal LUMI Warga. Setiap laporan masuk ke BPBD {province} untuk diverifikasi sebelum jadi informasi resmi.</p>
      </div>
      <span className="badge tier-verify">{waiting} menunggu verifikasi</span>
    </header>
    {connection === "down" ? <div className="workflow-empty" role="alert"><strong>Antrean laporan belum terhubung</strong><span>Pastikan layanan demo lokal berjalan, lalu coba lagi sebentar.</span></div>
      : loaded && !mine.length ? <div className="workflow-empty"><strong>Belum ada laporan warga</strong><span>Laporan dari portal warga di {province} akan muncul di sini begitu dikirim.</span></div>
      : <div className="report-inbox" aria-label={`Laporan warga untuk ${province}`}>
        {mine.map((report) => <article key={report.id} className="report-inbox-item">
          <div className="report-inbox-main">
            <p className="eyebrow">{report.id} · {formatDate(report.createdAt)}</p>
            <h2>{report.category}</h2>
            <p className="report-inbox-desc">{report.description}</p>
            <div className="report-inbox-meta">
              <span><strong>Lokasi</strong>{locationLabel(report.location)}</span>
              <span><strong>Pelapor</strong>{report.citizen}</span>
              <span><strong>Antrean</strong>{report.queueLabel ?? report.queue}</span>
            </div>
          </div>
          <div className="report-inbox-side">
            <span className={`badge ${report.status === "Menunggu verifikasi" ? "tier-verify" : "tier-monitor"}`}>{report.status}</span>
            {report.images.length ? <p className="muted small">{report.images.length} foto terlampir</p> : null}
          </div>
        </article>)}
      </div>}
  </section>;
}
