"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LumiMark } from "@/components/brand-marks";
import { ThemeInit } from "@/components/theme-init";
import { dashboardPath, EMAIL_PATTERN, PASSWORD_MIN, readAccount, readSession, saveSession, verifyLogin } from "@/lib/warga-session";

export default function MasukPage() {
  const router = useRouter();
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
    if (!EMAIL_PATTERN.test(email)) return setError("Masukkan email yang valid, contoh nama@email.id.");
    if (password.length < PASSWORD_MIN) return setError(`Kata sandi minimal ${PASSWORD_MIN} karakter.`);
    setBusy(true);
    const result = await verifyLogin(email, password);
    setBusy(false);
    if (result === "no-account") return setError("Belum ada akun dengan email ini di perangkat. Daftar dulu — sekali saja.");
    if (result === "wrong-password") return setError("Kata sandi belum cocok. Coba lagi.");
    saveSession(email);
    router.push(dashboardPath(readAccount()?.region));
  };

  return <main className="warga-auth">
    <ThemeInit />
    <header className="warga-header"><Link className="brand" href="/"><span className="brand-mark" aria-hidden><LumiMark /></span>LUMI Warga</Link></header>
    <section className="warga-auth-panel">
      <div><p className="warga-eyebrow">MASUK WARGA</p><h1>Selamat datang kembali.</h1><p className="muted">Masuk dengan email dan kata sandi. Tanpa OTP, tanpa akun Google.</p></div>
      <form className="warga-auth-form" onSubmit={submit} noValidate>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="nama@email.id" required /></label>
        <label>Kata sandi<input name="password" type="password" autoComplete="current-password" minLength={PASSWORD_MIN} placeholder="Minimal 8 karakter" required /></label>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <button className="button" type="submit" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</button>
        <p className="muted small">Belum punya akun? <Link href="/daftar">Daftar</Link></p>
      </form>
    </section>
  </main>;
}
