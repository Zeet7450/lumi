import { CitizenShell } from "@/components/citizen-shell";
import { NationalIspuMap } from "@/components/national-ispu-map";

export const metadata = { title: "Peta Nasional — LUMI Warga" };

/** Citizen-facing national map: the same live ISPU map the ops side watches. */
export default function CitizenMapPage() {
  return <CitizenShell>
    <section className="citizen-page">
      <header className="citizen-page-head"><p className="warga-eyebrow">PETA NASIONAL</p><h1>Pantau udara dan titik api se-Indonesia.</h1><p className="muted">Peta yang sama dengan yang dipakai petugas — 2.000 titik pemantauan, bisa difilter per provinsi.</p></header>
      <NationalIspuMap citizen />
    </section>
  </CitizenShell>;
}
