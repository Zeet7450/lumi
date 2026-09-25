"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LumiMark } from "@/components/brand-marks";
import { ThemeInit } from "@/components/theme-init";
import { demoReferencePoints } from "@/lib/demo-locations";
import { dashboardPath, DEFAULT_REGION, EMAIL_PATTERN, hashPassword, PASSWORD_MIN, readAccount, readSession, registerAccount, saveSession, type WargaGender } from "@/lib/warga-session";

const GENDERS: Array<{ value: WargaGender; label: string }> = [
  { value: "perempuan", label: "Perempuan" },
  { value: "laki-laki", label: "Laki-laki" },
  { value: "lainnya", label: "Lainnya / tidak menyebut" }
];

export default function DaftarPage() {
  const router = useRouter();
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const existing = readSession();
    if (existing) router.replace(dashboardPath(existing.region));
  }, [router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const gender = String(form.get("gender") ?? "") as WargaGender;
    const nickname = String(form.get("nickname") ?? "").trim();
    if (!EMAIL_PATTERN.test(email)) return setError("Masukkan email yang valid, contoh nama@email.id.");
    if (password.length < PASSWORD_MIN) return setError(`Kata sandi minimal ${PASSWORD_MIN} karakter.`);
    if (!GENDERS.some((item) => item.value === gender)) return setError("Pilih gender terlebih dahulu.");
    if (nickname.length < 2) return setError("Nama panggilan minimal 2 huruf.");
    if (readAccount()?.email === email) return setError("Email ini sudah terdaftar di perangkat. Masuk saja lewat halaman Masuk.");
    setBusy(true);
    registerAccount({ email, passHash: await hashPassword(password), gender, nickname, region });
    saveSession(email);
    setBusy(false);
    router.push(dashboardPath(region));
  };

  return <main className="warga-auth">
    <ThemeInit />
    <header className="warga-header"><Link className="brand" href="/"><span className="brand-mark" aria-hidden><LumiMark /></span>LUMI Warga</Link></header>
    <section className="warga-auth-panel">
      <div><p className="warga-eyebrow">DAFTAR WARGA</p><h1>Satu akun untuk pantau wilayahmu.</h1><p className="muted">Email, kata sandi, gender, dan nama panggilan — semua wajib. Tanpa OTP, tanpa akun Google. Profil tersimpan di perangkat ini sampai 60 hari.</p></div>
      <form className="warga-auth-form" onSubmit={submit} noValidate>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="nama@email.id" required /></label>
        <label>Kata sandi<input name="password" type="password" autoComplete="new-password" minLength={PASSWORD_MIN} placeholder="Minimal 8 karakter" required /></label>
        <label>Gender<select name="gender" defaultValue="" required>
          <option value="" disabled>Pilih gender</option>
          {GENDERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select></label>
        <label>Nama panggilan<input name="nickname" type="text" autoComplete="nickname" placeholder="Misal: Bu Ani" minLength={2} required /></label>
        <label>Wilayah utama<select value={region} onChange={(event) => setRegion(event.target.value)}>
          {demoReferencePoints.map((point) => <option key={point.id} value={point.id}>{point.name}, {point.kabupaten}</option>)}
        </select></label>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <button className="button" type="submit" disabled={busy}>{busy ? "Menyiapkan akun…" : "Buat akun & buka dashboard"}</button>
        <p className="muted small">Sudah punya akun? <Link href="/masuk">Masuk</Link></p>
      </form>
    </section>
  </main>;
}
