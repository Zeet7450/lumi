import Link from "next/link";
import { LumiMark } from "@/components/brand-marks";
import { LocalDemoLogin } from "@/components/local-demo-login";
import { redirect } from "next/navigation";
import { WargaPortal } from "@/components/warga-portal";
import { loadCitizenPoints } from "@/lib/citizen-points";

export default async function HomePage() {
  if (process.env.LUMI_ENTRY === "ops" || process.env.LUMI_ENTRY === "simulator") redirect("/ops/login");
  if (process.env.LUMI_ENTRY === "warga") return <WargaPortal points={(await loadCitizenPoints()).points} />;
  return <main className="entry-page">
    <header className="entry-topbar">
      <Link className="brand" href="/"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI</span></Link>
      <span className="entry-topbar-note">Koordinasi instansi</span>
    </header>
    <section className="entry-hero" aria-labelledby="entry-title">
      <div>
        <p className="eyebrow">Kalimantan Barat · Kebakaran lahan & asap</p>
        <h1 id="entry-title">Masuk ke ruang koordinasi LUMI.</h1>
        <p className="entry-lede">Masuk untuk menelusuri alur informasi lintas instansi — dari penyusunan skenario sampai informasi warga yang diterbitkan.</p>
        <LocalDemoLogin />
      </div>
      <aside className="entry-flow" aria-label="Alur koordinasi LUMI">
        <p className="eyebrow">Alur lintas instansi</p>
        <ol>
          <li>Ruang uji menyusun skenario kejadian</li>
          <li>DLH memvalidasi dampak lingkungan</li>
          <li>BPBD memverifikasi dan mencatat respons</li>
          <li>Approver menerbitkan informasi warga</li>
        </ol>
      </aside>
    </section>
    <section className="entry-disclaimer" aria-label="Pernyataan data uji"><strong>DATA UJI</strong><span>Semua informasi di halaman ini adalah data uji, bukan kondisi bencana nyata atau arahan resmi.</span></section>
  </main>;
}
