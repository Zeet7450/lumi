"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getLocalDemoAccount } from "@/lib/local-demo-identity";
import type { DemoRole } from "@/lib/demo-scenario";
import { LumiMark } from "./brand-marks";
import { CaseNotificationBell } from "./case-notification-bell";
import { useDemoScenario } from "./demo-scenario-store";
import { ThemeInit } from "./theme-init";

type IconName = "incident" | "publish" | "simulator" | "settings" | "collapse" | "expand" | "history" | "response" | "template" | "map" | "case" | "national" | "monitor" | "globe" | "log";

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    case: <><path d="M9 4h6v3H9z" /><path d="M9 5.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2h-2" /><path d="m9.5 13 1.8 1.8L15 11" /></>,
    national: <><path d="M4 21h16M6 21V10M10 21V10M14 21V10M18 21V10M3 10h18L12 4z" /></>,
    monitor: <><path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" /></>,
    log: <><path d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h8" /></>,
    incident: <><path d="M12 3 4 7v5c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V7l-8-4Z" /><path d="m12 8-2.5 4h3l-2 4" /></>,
    publish: <><path d="M4 5h16v14H4z" /><path d="m8 10 3 3 5-5" /></>,
    simulator: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    history: <><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v5h5M12 8v4l3 2" /></>,
    response: <><path d="M5 4h14v16H5z" /><path d="M8 9h8M8 13h6" /></>,
    template: <><path d="M7 3h8l3 3v15H7z" /><path d="M15 3v4h4M10 11h5M10 15h5" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L8.4 6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4.7h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.4 1Z" /></>,
    collapse: <path d="m15 18-6-6 6-6" />,
    expand: <path d="m9 18 6-6-6-6" />
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

type NavigationLink = { href: string; label: string; icon: Exclude<IconName, "collapse" | "expand"> };

const linksByRole: Record<Exclude<DemoRole, "WARGA">, readonly NavigationLink[]> = {
  DLH: [
    { href: "/ops/peta-nasional", label: "Peta ISPU Nasional", icon: "map" },
    { href: "/ops/kasus", label: "Verifikasi & Tindakan", icon: "case" },
    { href: "/ops/insiden?ruang=lingkungan", label: "Peta Lingkungan", icon: "globe" },
    { href: "/ops/insiden?ruang=validasi", label: "Validasi Observasi", icon: "incident" }
  ],
  BPBD: [
    { href: "/ops/nasional", label: "Peta Hotspot Nasional", icon: "national" },
    { href: "/ops/laporan", label: "Laporan Warga", icon: "incident" },
    { href: "/ops/kasus", label: "Verifikasi & Tindakan", icon: "case" }
  ],
  BNPB: [
    { href: "/ops/peta-nasional", label: "Peta ISPU Nasional", icon: "map" },
    { href: "/ops/nasional", label: "Peta Hotspot Nasional", icon: "national" }
  ],
  KLHK: [
    { href: "/ops/peta-nasional", label: "Peta ISPU Nasional", icon: "map" },
    { href: "/ops/monitoring", label: "Monitoring Nasional", icon: "monitor" }
  ],
  APPROVER: [
    { href: "/ops/publikasi?ruang=antrean", label: "Antrean Persetujuan", icon: "publish" },
    { href: "/ops/publikasi?ruang=aktif", label: "Publikasi Aktif", icon: "history" }
  ],
  SIMULATOR: [
    { href: "/ops/simulasi", label: "Simulation Center", icon: "simulator" },
    { href: "/ops/simulasi?ruang=template", label: "Template Skenario", icon: "template" }
  ]
};

export function OpsShell({ children }: Readonly<{ children: React.ReactNode; allowed?: unknown }>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { role, sessionProvince } = useDemoScenario();
  const [collapsed, setCollapsed] = useState(false);
  const account = getLocalDemoAccount(role, sessionProvince);
  const links = role === "WARGA" ? [] : linksByRole[role];
  useEffect(() => {
    const stored = window.localStorage.getItem("lumi-ops-sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);
  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("lumi-ops-sidebar-collapsed", String(next));
      window.setTimeout(() => window.dispatchEvent(new Event("lumi-sidebar-resize")), 210);
      return next;
    });
  }
  const active = (href: string) => pathname === href.split("?")[0] && (!href.includes("?") || new URLSearchParams(href.split("?")[1]).get("ruang") === searchParams.get("ruang"));
  return <>
    <ThemeInit />
    <div className={`ops-layout${collapsed ? " is-sidebar-collapsed" : ""}`}>
      <aside className="ops-sidebar">
        <div className="sidebar-brand-row">
          <Link className="brand" href={account.destination} title="LUMI Ops"><span className="brand-mark" aria-hidden><LumiMark /></span><span className="sidebar-label">LUMI Ops</span></Link>
          <button className="sidebar-collapse icon-button" type="button" onClick={toggleSidebar} aria-label={collapsed ? "Perluas sidebar" : "Ringkas sidebar"} title={collapsed ? "Perluas sidebar" : "Ringkas sidebar"}><NavIcon name={collapsed ? "expand" : "collapse"} /></button>
        </div>
        <nav className="nav ops-navigation" aria-label="Navigasi petugas">
          {links.map((link) => <Link key={link.href} className={active(link.href) ? "active" : ""} href={link.href} title={collapsed ? link.label : undefined}><NavIcon name={link.icon} /><span className="sidebar-label">{link.label}</span></Link>)}
        </nav>
        <nav className="nav ops-navigation ops-settings-nav" aria-label="Pengaturan"><Link className={pathname === "/ops/log" ? "active" : ""} href="/ops/log" title={collapsed ? "Log & Audit" : undefined}><NavIcon name="log" /><span className="sidebar-label">Log &amp; Audit</span></Link><Link className={pathname === "/ops/pengaturan" ? "active" : ""} href="/ops/pengaturan" title={collapsed ? "Pengaturan" : undefined}><NavIcon name="settings" /><span className="sidebar-label">Pengaturan</span></Link></nav>
      </aside>
      <main className="ops-main"><header className="ops-topbar"><div><span className="ops-topbar-kicker">LUMI · Ruang kerja instansi</span><strong>Koordinasi lintas instansi</strong></div><div className="ops-utilities"><CaseNotificationBell /><span className="session-role">{account.province ? <><span className="session-role-title">{account.label.split(` ${account.province}`)[0]}</span><span className="session-role-province">{account.province}</span></> : account.label}</span></div></header>{children}</main>
    </div>
  </>;
}
