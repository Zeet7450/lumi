"use client";

import Link from "next/link";
import { useDemoScenario } from "./demo-scenario-store";

export function PublicStatus({ details = false }: { slug?: string; details?: boolean }) {
  const { publicNotice, role } = useDemoScenario();
  if (role !== "WARGA") return <section className="status-hero"><p className="eyebrow">Portal Warga · proyeksi publik</p><h1>Pilih peran Warga untuk melihat portal publik</h1><p className="notice">Mode ini tidak menampilkan draf, bukti internal, atau tindakan operasional.</p></section>;
  if (!publicNotice) return <section className="status-hero"><p className="eyebrow">Informasi warga · data sintetis</p><h1>Belum ada informasi yang disetujui</h1><p className="notice">Warga hanya melihat pemberitahuan setelah approver manusia menerbitkannya.</p><p className="freshness">Draf dan pekerjaan internal tidak tersedia di portal ini.</p></section>;
  const { region, notice } = publicNotice;
  return <section className="status-hero"><p className="eyebrow">Informasi warga · {region.province}</p><h1>{region.name}</h1><span className="badge tier-high">Informasi disetujui</span><p className="notice">{notice.text}</p><div className="data-grid" aria-label="Ringkasan informasi warga"><div className="data-point"><span className="muted">AQI data uji</span><strong>{notice.aqi}</strong></div><div className="data-point"><span className="muted">PM2.5 data uji</span><strong>{notice.pm25} µg/m³</strong></div><div className="data-point"><span className="muted">Diterbitkan</span><strong>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(notice.publishedAt))} WIB</strong></div></div><p className="freshness">Hanya informasi yang sudah disetujui ditampilkan. Tidak ada data mentah atau operasi internal.</p>{!details && <Link className="button" href={`/wilayah/${region.slug}`}>Baca informasi wilayah</Link>}</section>;
}
