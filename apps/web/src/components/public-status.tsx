"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatTime, freshnessLabel, getPublicRegion, tierLabel, type PublicProjection } from "@/lib/lumi";

function tierClass(tier: PublicProjection["notice"]["tier"]) { return tier === "HIGH_RESPONSE" ? "tier-high" : tier === "VERIFY" ? "tier-verify" : "tier-monitor"; }

export function PublicStatus({ slug = "pontianak", details = false }: { slug?: string; details?: boolean }) {
  const [result, setResult] = useState<{ projection: PublicProjection | null; preview: boolean }>();
  useEffect(() => { void getPublicRegion(slug).then(setResult); }, [slug]);
  if (!result) return <section className="status-hero" aria-busy="true"><p className="eyebrow">Memuat pembaruan resmi</p><h1>Menyiapkan informasi wilayah…</h1></section>;
  if (!result.projection) return <section className="status-hero"><p className="eyebrow">Informasi wilayah</p><h1>Belum ada pembaruan yang disetujui</h1><p className="notice">Pantau informasi resmi terbaru dari pemerintah daerah.</p></section>;
  const { region, notice } = result.projection;
  return <>
    {result.preview && <p className="preview">Sambungan data belum tersedia. Silakan periksa kembali beberapa saat lagi.</p>}
    <section className="status-hero">
      <p className="eyebrow">Status udara resmi · {region.province}</p>
      <h1>{region.name}</h1>
      <span className={`badge ${tierClass(notice.tier)}`}>● {tierLabel(notice.tier)}</span>
      <p className="notice">{notice.text}</p>
      <div className="data-grid" aria-label="Ringkasan pembaruan">
        <div className="data-point"><span className="muted">Status data</span><strong>{freshnessLabel(notice.currentFreshness)}</strong></div>
        <div className="data-point"><span className="muted">Diamati</span><strong>{formatTime(notice.dataObservedAt)}</strong></div>
        <div className="data-point"><span className="muted">Diterbitkan</span><strong>{formatTime(notice.publishedAt)}</strong></div>
      </div>
      <p className="freshness">Sumber: {notice.sources.join(", ") || "Belum tersedia"}</p>
      {!details && <Link className="button" href={`/wilayah/${region.slug}`}>Baca panduan untuk wilayah ini</Link>}
    </section>
  </>;
}
