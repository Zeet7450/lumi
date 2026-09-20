"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LumiMark } from "./brand-marks";
import { DemoRoleControl } from "./demo-role-control";
import { ThemeInit } from "./theme-init";

export function OpsShell({ children }: Readonly<{ children: React.ReactNode; allowed?: unknown }>) {
  const pathname = usePathname();
  return <><ThemeInit /><div className="ops-layout"><aside className="ops-sidebar"><Link className="brand" href="/ops/insiden"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI Ops</span></Link><p className="muted">Demo lokal · alur lintas instansi</p><DemoRoleControl /><nav className="nav" aria-label="Navigasi petugas"><Link className={pathname === "/ops/insiden" ? "active" : ""} href="/ops/insiden">Alur insiden</Link><Link className={pathname === "/ops/publikasi" ? "active" : ""} href="/ops/publikasi">Persetujuan publik</Link><Link href="/ops/simulasi">Simulation Center</Link><Link className={pathname === "/ops/pengaturan" ? "active" : ""} href="/ops/pengaturan">Pengaturan</Link></nav><div className="sidebar-utilities"><Link className="text-utility" href="/">Lihat portal warga</Link><p>Peran demo hanya mengatur aksi di browser ini; ini bukan autentikasi produksi.</p></div></aside><main className="ops-main">{children}</main></div></>;
}
