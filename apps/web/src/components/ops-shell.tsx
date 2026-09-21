"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LumiMark } from "./brand-marks";
import { useDemoScenario } from "./demo-scenario-store";
import { ThemeInit } from "./theme-init";
import { ThemeToggle } from "./theme-toggle";
import { LocalDemoLogout } from "./local-demo-logout";

export function OpsShell({ children }: Readonly<{ children: React.ReactNode; allowed?: unknown }>) {
  const pathname = usePathname();
  const { role } = useDemoScenario();
  return <><ThemeInit /><div className="ops-layout"><aside className="ops-sidebar"><Link className="brand" href="/ops/insiden"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI Ops</span></Link><p className="muted">Demo lokal · alur lintas instansi</p><nav className="nav" aria-label="Navigasi petugas"><Link className={pathname === "/ops/insiden" ? "active" : ""} href="/ops/insiden">Alur insiden</Link><Link className={pathname === "/ops/publikasi" ? "active" : ""} href="/ops/publikasi">Persetujuan publik</Link><Link href="/ops/simulasi">Simulation Center</Link><Link className={pathname === "/ops/pengaturan" ? "active" : ""} href="/ops/pengaturan">Pengaturan</Link></nav><div className="sidebar-utilities"><p>Peran aktif ditentukan oleh akun demo lokal.</p><LocalDemoLogout /></div></aside><main className="ops-main"><header className="ops-topbar"><div><span className="ops-topbar-kicker">LUMI · Demo instansi</span><strong>Koordinasi Kalimantan Barat</strong></div><div className="ops-utilities"><span className="session-role">Akun · {role}</span><ThemeToggle /><LocalDemoLogout /></div></header>{children}</main></div></>;
}
