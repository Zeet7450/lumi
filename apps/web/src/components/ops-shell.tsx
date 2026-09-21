"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getLocalDemoAccount } from "@/lib/local-demo-identity";
import { LumiMark } from "./brand-marks";
import { useDemoScenario } from "./demo-scenario-store";
import { ThemeInit } from "./theme-init";
import { ThemeToggle } from "./theme-toggle";

type IconName = "incident" | "publish" | "simulator" | "settings" | "collapse" | "expand";

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    incident: <><path d="M12 3 4 7v5c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V7l-8-4Z" /><path d="m12 8-2.5 4h3l-2 4" /></>,
    publish: <><path d="M4 5h16v14H4z" /><path d="m8 10 3 3 5-5" /></>,
    simulator: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L8.4 6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4.7h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.4 1Z" /></>,
    collapse: <path d="m15 18-6-6 6-6" />,
    expand: <path d="m9 18 6-6-6-6" />
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

const links: Array<{ href: string; label: string; icon: Exclude<IconName, "collapse" | "expand"> }> = [
  { href: "/ops/insiden", label: "Alur insiden", icon: "incident" },
  { href: "/ops/publikasi", label: "Persetujuan publik", icon: "publish" },
  { href: "/ops/simulasi", label: "Simulation Center", icon: "simulator" }
];

export function OpsShell({ children }: Readonly<{ children: React.ReactNode; allowed?: unknown }>) {
  const pathname = usePathname();
  const { role } = useDemoScenario();
  const [collapsed, setCollapsed] = useState(false);
  const account = getLocalDemoAccount(role);
  useEffect(() => {
    const stored = window.localStorage.getItem("lumi-ops-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);
  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("lumi-ops-sidebar-collapsed", String(next));
      window.dispatchEvent(new Event("lumi-sidebar-resize"));
      return next;
    });
  }
  return <><ThemeInit /><div className={`ops-layout${collapsed ? " is-sidebar-collapsed" : ""}`}><aside className="ops-sidebar"><div className="sidebar-brand-row"><Link className="brand" href="/ops/insiden" title="LUMI Ops"><span className="brand-mark" aria-hidden><LumiMark /></span><span className="sidebar-label">LUMI Ops</span></Link><button className="sidebar-collapse icon-button" type="button" onClick={toggleSidebar} aria-label={collapsed ? "Perluas sidebar" : "Ringkas sidebar"} title={collapsed ? "Perluas sidebar" : "Ringkas sidebar"}><NavIcon name={collapsed ? "expand" : "collapse"} /></button></div><p className="muted sidebar-label">Demo lokal · alur lintas instansi</p><nav className="nav ops-navigation" aria-label="Navigasi petugas">{links.map((link) => <Link key={link.href} className={pathname === link.href ? "active" : ""} href={link.href} title={collapsed ? link.label : undefined}><NavIcon name={link.icon} /><span className="sidebar-label">{link.label}</span></Link>)}</nav><nav className="nav ops-navigation ops-settings-nav" aria-label="Pengaturan"><Link className={pathname === "/ops/pengaturan" ? "active" : ""} href="/ops/pengaturan" title={collapsed ? "Pengaturan" : undefined}><NavIcon name="settings" /><span className="sidebar-label">Pengaturan</span></Link></nav></aside><main className="ops-main"><header className="ops-topbar"><div><span className="ops-topbar-kicker">LUMI · Demo instansi</span><strong>Koordinasi Kalimantan Barat</strong></div><div className="ops-utilities"><span className="session-role">{account.label}</span><ThemeToggle /></div></header>{children}</main></div></>;
}
