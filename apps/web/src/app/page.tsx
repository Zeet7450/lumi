import Link from "next/link";
import { LumiMark } from "@/components/brand-marks";
import { LocalDemoLogin } from "@/components/local-demo-login";
import { redirect } from "next/navigation";

export default function HomePage() {
  if (process.env.LUMI_ENTRY === "ops" || process.env.LUMI_ENTRY === "simulator") redirect("/ops/login");
  return <main className="entry-page">
    <header className="entry-topbar">
      <Link className="brand" href="/"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI</span></Link>
      <span className="entry-topbar-note">Demo koordinasi instansi</span>
    </header>
    <section className="entry-hero" aria-labelledby="entry-title">
      <div>
        <p className="eyebrow">Kalimantan Barat · Kebakaran lahan & asap</p>
        <h1 id="entry-title">Masuk ke ruang latihan koordinasi LUMI.</h1>
        <p className="entry-lede">Gunakan akun demo lokal untuk melihat peran Simulator, DLH, BPBD, Approver, atau Warga pada alur informasi sintetis.</p>
        <LocalDemoLogin />
      </div>
      <aside className="entry-flow" aria-label="Alur demo LUMI">
        <p className="eyebrow">Alur data uji</p>
        <ol>
          <li>Simulator membuat skenario sintetis</li>
          <li>DLH memvalidasi dampak lingkungan</li>
          <li>BPBD memverifikasi dan mencatat respons</li>
          <li>Approver menerbitkan informasi warga</li>
        </ol>
      </aside>
    </section>
    <section className="entry-disclaimer" aria-label="Pernyataan data simulasi"><strong>SIMULATION MODE</strong><span>Semua informasi di demo ini adalah data uji, bukan kondisi bencana nyata atau arahan resmi.</span></section>
  </main>;
}
