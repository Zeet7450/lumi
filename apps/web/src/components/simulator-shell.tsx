"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOpsSession } from "@/lib/ops-session";
import { logout } from "@/lib/lumi";
import { LumiMark } from "./brand-marks";
import { ThemeInit } from "./theme-init";

export function SimulatorShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { session, clear } = useOpsSession();
  const router = useRouter();
  async function signOut() {
    try { await logout(); }
    finally { clear(); router.push("/ops/login"); }
  }

  if (!session) return <><ThemeInit /><main className="login-wrap"><section className="login-card"><p className="eyebrow">LUMI Simulator</p><h1>Masuk untuk mengirim data</h1><p className="muted">Ruang ini hanya untuk administrator simulator yang berwenang.</p><Link className="button" href="/ops/login">Ke halaman masuk</Link></section></main></>;
  if (session.actor.role !== "ADMIN_DEMO") return <><ThemeInit /><main className="login-wrap"><section className="login-card"><p className="eyebrow">Akses dibatasi</p><h1>Ruang ini khusus Admin Simulator.</h1><p className="muted">Gunakan portal LUMI Ops untuk pekerjaan lintas instansi.</p><Link className="button" href="/ops/insiden">Kembali ke LUMI Ops</Link></section></main></>;

  return <><ThemeInit /><div className="simulator-shell"><header className="simulator-header"><Link className="brand" href="/ops/simulasi"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI Simulator</span></Link><div className="simulator-utilities"><span className="simulator-role">ADMIN SIMULATOR</span><button type="button" className="text-utility" onClick={() => void signOut()}>Keluar</button></div></header><main className="simulator-main">{children}</main></div></>;
}
