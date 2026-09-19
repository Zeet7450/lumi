"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/lumi";
import { useOpsSession } from "@/lib/ops-session";
import { ThemeInit } from "./theme-init";
import { ThemeToggle } from "./theme-toggle";
import { LumiMark } from "./brand-marks";

export function OpsLogin() {
  const router = useRouter();
  const { save } = useOpsSession();
  const [email, setEmail] = useState("operator.dlh@demo.lumi.id");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const session = await login(email, password);
      save(session);
      router.push(session.actor.role === "ADMIN_DEMO" ? "/ops/simulasi" : "/ops/insiden?tur=1");
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Tidak dapat masuk saat ini."); }
    finally { setBusy(false); }
  }
  const useDemo = (nextEmail: string) => { setEmail(nextEmail); };
  return <><ThemeInit /><header className="shell topbar"><Link className="brand" href="/"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI</span></Link><ThemeToggle /></header><main className="login-wrap"><section className="login-card"><p className="eyebrow">Ruang petugas</p><h1 style={{ margin: "5px 0" }}>Masuk ke LUMI Ops</h1><p className="muted">Gunakan identitas yang sesuai untuk membuka ruang kerja.</p><form onSubmit={submit}><label className="field">Email<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="field">Kata sandi<input required type="password" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="error" role="alert">{error}</p>}<button className="button" style={{ width: "100%", marginTop: 20 }} disabled={busy}>{busy ? "Memeriksa akses…" : "Masuk ke dashboard"}</button></form><p className="muted" style={{ fontSize: ".9rem" }}>Pilih identitas demo, lalu masukkan kata sandi demo yang dibuat dalam konfigurasi lokal: <button className="theme-button" onClick={() => useDemo("operator.dlh@demo.lumi.id")}>DLH</button> <button className="theme-button" onClick={() => useDemo("koordinator.bpbd@demo.lumi.id")}>BPBD</button> <button className="theme-button" onClick={() => useDemo("approver.diskominfo@demo.lumi.id")}>Diskominfo</button> <button className="theme-button" onClick={() => useDemo("simulator@demo.lumi.id")}>Simulator</button></p></section></main></>;
}
