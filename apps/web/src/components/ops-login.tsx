"use client";

import Link from "next/link";
import { ThemeInit } from "./theme-init";
import { ThemeToggle } from "./theme-toggle";
import { LumiMark } from "./brand-marks";
import { DemoRoleControl } from "./demo-role-control";

export function OpsLogin() {
  return <><ThemeInit /><header className="shell topbar"><Link className="brand" href="/"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI</span></Link><ThemeToggle /></header><main className="login-wrap"><section className="login-card"><p className="eyebrow">Ruang petugas · demo lokal</p><h1 style={{ margin: "5px 0" }}>Pilih peran untuk melanjutkan</h1><p className="muted">Tidak ada kata sandi atau layanan backend pada demo ini. Selector hanya menentukan tindakan yang dapat dicoba di browser ini.</p><DemoRoleControl /><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}><Link className="button" href="/ops/insiden">Buka alur insiden</Link><Link className="button secondary" href="/ops/simulasi">Buka Simulation Center</Link><Link className="text-utility" href="/">Lihat portal warga</Link></div></section></main></>;
}
