import { CitizenShell } from "@/components/citizen-shell";
import { CitizenDashboard } from "@/components/citizen-dashboard";

export const metadata = { title: "Laporkan kondisi — LUMI Warga" };

/** Citizen report page: description, photos, and location in one calm form. */
export default function CitizenReportPage() {
  return <CitizenShell>
    <section className="citizen-page">
      <header className="citizen-page-head"><p className="warga-eyebrow">LAPORKAN KONDISI</p><h1>Lihat atau alami sesuatu? Laporkan di sini.</h1><p className="muted">Laporan Anda masuk antrean internal dan diperiksa petugas sebelum jadi informasi resmi.</p></header>
      <CitizenDashboard regionSlug="pontianak" />
    </section>
  </CitizenShell>;
}
