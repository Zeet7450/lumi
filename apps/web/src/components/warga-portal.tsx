"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import { LumiMark } from "./brand-marks";
import { NationalIspuMap } from "./national-ispu-map";
import { IntroReveal } from "./warga-intro";
import type { CitizenPoint } from "@/lib/citizen-points";
import { dashboardPath, readSession } from "@/lib/warga-session";

/**
 * Citizen landing page. Visual layer is built on Motion for React (the
 * animation engine behind motion.dev): spring-driven reveals, a scroll-linked
 * underline, and a number that counts itself. Content styling uses the same
 * --warga-* tokens as before; what changed is how things arrive and how the
 * footer is laid out. Reduced-motion users get static content via CSS.
 */

/** A lived-day beat. Concrete and generic: no invented dates or places. */
const HAZE_DAY: Array<{ time: string; line: string }> = [
  { time: "Pagi", line: "Mata perih. Bau asap masuk dari celah jendela." },
  { time: "Siang", line: "Jalan ke depan tertutup kabut. Anak diminta pulang lebih awal." },
  { time: "Sore", line: "Grup chat ramai. Satu bilang aman, satu bilang jangan keluar rumah." },
  { time: "Malam", line: "Rumor bertambah. Kepastian tidak." }
];

const STEPS: Array<{ title: string; text: string }> = [
  { title: "Sensor mendeteksi", text: "Titik pemantauan mencatat sinyal awal kondisi udara di sekitar wilayah." },
  { title: "BPBD memverifikasi", text: "Badan penanggulangan bencana memastikan sinyal itu benar dan layak ditindaklanjuti." },
  { title: "DLH memantau udara", text: "Petugas lingkungan memantau kualitas udara dan kondisi lapangan." },
  { title: "Informasi disebar", text: "Bersama Diskominfo, informasi resmi dikirim ke web warga dan notifikasi ponsel." },
  { title: "Anda menerima", text: "Sampai lengkap: seberapa parah, di mana, dan apa yang perlu Anda lakukan." }
];

const OUTCOMES: Array<{ title: string; text: string }> = [
  { title: "Kejelasan, bukan rumor", text: "Informasi yang sampai ke Anda selalu lewat pemeriksaan petugas, lengkap dengan angka kualitas udara dan saran yang bisa langsung dipraktikkan." },
  { title: "Peringatan lebih awal", text: "Saat asap berpotensi mengganggu, Anda tahu dari aplikasi sebelum mata terasa perih, bukan sebaliknya." },
  { title: "Suara warga didengar", text: "Laporan kondisi dari Anda menjadi bukti yang diperiksa petugas, bukan pesan yang hilang di grup." },
  { title: "Instansi bisa diaudit", text: "Setiap langkah, dari deteksi sampai penyelesaian, tercatat. Anda bisa melihat siapa memverifikasi apa dan kapan." }
];

const ROLES: Array<{ title: string; text: string }> = [
  { title: "Laporkan kondisi", text: "Lihat asap atau kebakaran? Kirim laporan dengan foto dan lokasi dari ponsel Anda. Petugas akan memeriksa." },
  { title: "Terima info resmi", text: "Notifikasi sampai ke ponsel saat ada kejadian di wilayah Anda. Sumbernya jelas, isinya bisa dipercaya." },
  { title: "Pantau terus", text: "Peta udara dan hotspot terbuka kapan saja. Cek kondisi wilayah sebelum beraktivitas di luar." }
];

/** Scroll-triggered spring reveal; hover lifts only where it means something. */
function Reveal({ children, delay = 0, y = 22, className }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  return <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    transition={{ type: "spring", stiffness: 90, damping: 18, delay }}
  >{children}</motion.div>;
}

/** Counter that ticks up to its value the first time it scrolls into view. */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const raw = useMotionValue(0);
  const spring = useSpring(raw, { stiffness: 60, damping: 20 });
  const text = useTransform(spring, (latest) => String(Math.round(latest)));
  useEffect(() => { if (inView) raw.set(value); }, [inView, raw, value]);
  return <span ref={ref}><motion.span>{text}</motion.span></span>;
}

export function WargaPortal({ points }: { points: CitizenPoint[] }) {
  const router = useRouter();

  const provinces = useMemo(() => [...new Set(points.map((point) => point.province))].sort(), [points]);

  // An authenticated citizen never sits on the landing page.
  useEffect(() => {
    const existing = readSession();
    if (existing) router.replace(dashboardPath(existing.region));
  }, [router]);

  return <main className="warga-page">
    <IntroReveal />
    <header className="warga-header">
      <Link className="brand warga-brand" href="/">
        <span className="brand-mark"><LumiMark /></span>LUMI Warga
      </Link>
      <nav>
        <Link className="warga-nav-link" href="/masuk">Masuk</Link>
        <Link className="button" href="/daftar">Daftar</Link>
      </nav>
    </header>

    {/* Hero. Hook first: name the feeling, promise the fix, then prove it with
        the live count. The accent word's underline draws itself on load. */}
    <section className="landing-hero" aria-labelledby="warga-h1">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
        style={{ display: "grid", gap: 26 }}
      >
        <p className="landing-hero-chip"><i aria-hidden="true" />Pemantauan aktif di {provinces.length} provinsi Kalimantan</p>
        <h1 id="warga-h1">Udara di luar sedang apa?<br /><span className="landing-hero-underline">Buka, langsung tahu.</span></h1>
        <p className="landing-hero-sub">Kabut asap datang tiap tahun, tetapi keputusan Anda tidak harus menunggu rumor. LUMI menunjukkan kondisi udara dan titik api di sekitar Anda, diperiksa petugas sebelum sampai ke layar Anda.</p>
        <div className="landing-hero-actions">
          <Link className="button" href="/daftar">Mulai pantau sekarang</Link>
          <Link className="warga-nav-link" href="/masuk">Saya sudah punya akun</Link>
        </div>
        <p className="landing-hero-count"><strong>{points.length ? <CountUp value={points.length} /> : 0}</strong> titik pemantauan aktif yang bisa Anda telusuri di bawah ini</p>
      </motion.div>
    </section>

    {/* The lived haze day: alternating cards slide in from opposite sides. */}
    <section className="landing-day" aria-label="Cerita satu hari berkabut">
      <p className="landing-day-title">Satu hari ketika asap datang</p>
      <ul className="landing-day-list">
        {HAZE_DAY.map((moment, index) => <Reveal key={moment.time} delay={index * 0.06}>
          <li>
            <span className="landing-day-time">{moment.time}</span>
            <p>{moment.line}</p>
          </li>
        </Reveal>)}
      </ul>
      <Reveal delay={0.1}>
        <p className="landing-day-close">Hari itu, semua orang tahu ada asap. <strong>Yang tidak ada: satu tempat untuk percaya.</strong> Sampai sekarang.</p>
      </Reveal>
    </section>

    {/* The live map, full-bleed, citizen style: clean frame, no ops toolbar. */}
    <section className="warga-map-section" aria-label="Peta titik pemantauan">
      <div className="warga-map-section-head">
        <p className="warga-eyebrow">PETA HIDUP</p>
        <h2>Titik pemantauan yang aktif sekarang.</h2>
        <p className="warga-map-sub">Bukan gambar. Peta yang sama dengan yang dipakai petugas, diperbarui terus, bisa Anda telusuri per provinsi.</p>
      </div>
      <NationalIspuMap citizen />
    </section>

    {/* Five compact steps, revealed one after another. */}
    <section className="landing-steps" id="cara-kerja" aria-label="Cara kerja LUMI">
      <Reveal>
        <div className="landing-cards-head">
          <p className="warga-eyebrow">CARA KERJANYA</p>
          <h2>Dari sinyal awal sampai informasi sampai ke Anda.</h2>
        </div>
      </Reveal>
      <div className="landing-steps-grid">
        {STEPS.map((step, index) => <Reveal key={step.title} delay={index * 0.08}>
          <article className="landing-step">
            <span className="landing-step-num">{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        </Reveal>)}
      </div>
    </section>

    <section className="landing-outcomes" aria-label="Yang berubah dengan LUMI">
      <Reveal>
        <div className="landing-cards-head">
          <p className="warga-eyebrow">YANG BERUBAH</p>
          <h2>Setelah ada LUMI.</h2>
        </div>
      </Reveal>
      <div className="landing-outcomes-grid">
        {OUTCOMES.map((item, index) => <Reveal key={item.title} delay={index * 0.06}>
          <article><strong>{item.title}</strong><p>{item.text}</p></article>
        </Reveal>)}
      </div>
    </section>

    <section className="landing-roles" aria-label="Peran Anda">
      <Reveal>
        <div className="landing-cards-head">
          <p className="warga-eyebrow">PERAN ANDA</p>
          <h2>Sistem ini hidup kalau warganya ikut.</h2>
        </div>
      </Reveal>
      <div className="landing-roles-grid">
        {ROLES.map((item, index) => <Reveal key={item.title} delay={index * 0.08}>
          <article>
            <span className="landing-role-badge">{index + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        </Reveal>)}
      </div>
    </section>

    {/* Closing CTA. */}
    <section className="warga-final-cta">
      <Reveal>
        <h2>Mulai pantau wilayah Anda.</h2>
        <p>Daftar sekali. Selebihnya, LUMI yang menjaga informasinya sampai ke Anda.</p>
        <div className="button-row button-row-center">
          <Link className="button" href="/daftar">Daftar sekarang</Link>
          <Link className="warga-nav-link" href="/masuk">Saya sudah punya akun</Link>
        </div>
      </Reveal>
    </section>

    {/* Footer: bento band, revealed in a soft cascade. */}
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <Reveal>
          <div className="landing-footer-brand">
            <span className="brand-mark"><LumiMark /></span>
            <p><strong>LUMI</strong> adalah layanan informasi lingkungan untuk warga Indonesia: memantau kualitas udara dan titik api, lalu menyampaikannya dengan bahasa yang bisa dipahami semua orang.</p>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <nav className="landing-footer-links" aria-label="Tautan resmi">
            <p className="landing-footer-head">Instansi terkait</p>
            <a href="https://www.klhk.go.id" target="_blank" rel="noreferrer">KLH (Kementerian Lingkungan Hidup)</a>
            <a href="https://bnpb.go.id" target="_blank" rel="noreferrer">BNPB (Badan Nasional Penanggulangan Bencana)</a>
            <a href="https://www.komdigi.go.id" target="_blank" rel="noreferrer">Kementerian Komunikasi dan Digital</a>
            <a href="https://www.bmkg.go.id" target="_blank" rel="noreferrer">BMKG (Meteorologi, Klimatologi, dan Geofisika)</a>
          </nav>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="landing-footer-contact">
            <p className="landing-footer-head">Kontak</p>
            <a href="mailto:kontak@lumi.id">kontak@lumi.id</a>
            <small>LUMI bersifat demo untuk keperluan pengembangan. Data yang tampil adalah simulasi.</small>
          </div>
        </Reveal>
      </div>
      <p className="landing-footer-legal"><span>© 2026 LUMI · Layanan informasi lingkungan publik untuk Indonesia</span><span>Data uji, bukan kondisi nyata</span></p>
    </footer>
  </main>;
}
