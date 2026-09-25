"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { demoReferencePoints } from "@/lib/demo-locations";
import { readSession } from "@/lib/warga-session";

const bridge = "http://127.0.0.1:3100";
type Report = { id: string; status: string; category: string; location: string; createdAt: string; citizen: string };

/**
 * Citizen dashboard extras: the citizen condition report (moved off the public
 * landing) plus the citizen's own submitted reports. Live notice/map live in
 * the surrounding PublicStatus sections.
 */
export function CitizenDashboard({ regionSlug }: { regionSlug: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const session = useMemo(() => readSession(), []);

  const refresh = async () => {
    try {
      const data = await (await fetch(`${bridge}/state`, { cache: "no-store" })).json();
      setReports(Array.isArray(data.reports) ? data.reports.filter((report: Report) => !session || report.citizen === session.email) : []);
    } catch { setMessage("Antrean laporan belum terhubung. Coba lagi sebentar."); }
  };
  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 5_000); return () => window.clearInterval(timer); }, [session]);

  const files = (input: FileList | null) => {
    if (!input) return;
    const next = Array.from(input).slice(0, 3);
    Promise.all(next.map((file) => new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file); }))).then(setImages);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const location = String(form.get("location") || regionSlug);
    // Route by province: the report lands at the BPBD (or DLH) of the province
    // the chosen point belongs to, never in a national pile.
    const province = demoReferencePoints.find((point) => point.id === location)?.province ?? "Kalimantan Barat";
    const response = await fetch(`${bridge}/reports`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ citizen: session?.email ?? "warga", category: form.get("category"), location, province, description: form.get("description"), images }) });
    setMessage(response.ok ? `Laporan dikirim ke antrean BPBD ${province} untuk verifikasi.` : "Laporan belum dapat dikirim. Periksa isian lalu coba lagi.");
    if (response.ok) { setImages([]); event.currentTarget.reset(); void refresh(); }
  };

  return <section className="citizen-dashboard" aria-labelledby="citizen-dashboard-title">
    <div className="ops-header"><div><p className="eyebrow">LAPORAN WARGA</p><h2 id="citizen-dashboard-title">Bagikan kondisi di sekitar Anda.</h2><p className="muted">Laporan dan foto masuk sebagai bukti internal untuk diperiksa petugas — bukan informasi resmi.</p></div></div>
    <form className="citizen-report-form" onSubmit={submit}>
      <label>Kategori<select name="category" required><option>Kondisi udara/asap</option><option>Api atau asap terlihat</option><option>Permintaan bantuan</option></select></label>
      <label>Lokasi<select name="location" defaultValue={regionSlug} required><option value={regionSlug}>Wilayah utama saya</option>{demoReferencePoints.map((point) => <option key={point.id} value={point.id}>{point.name}, {point.kabupaten}</option>)}</select></label>
      <label>Deskripsi singkat<textarea name="description" minLength={8} maxLength={500} required /></label>
      <label>Foto, maksimal tiga<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => files(event.target.files)} /></label>
      {images.length ? <div className="report-previews">{images.map((image) => <img src={image} key={image} alt="Pratinjau foto laporan" />)}</div> : null}
      {message ? <p className="warga-message" role="status">{message}</p> : null}
      <button className="button" type="submit">Kirim untuk verifikasi</button>
    </form>
    {reports.length ? <div className="my-reports"><h3>Laporan saya</h3>{reports.map((report) => <article key={report.id}><strong>{report.category}</strong><span>{report.location} · {report.status}</span></article>)}</div> : null}
  </section>;
}
