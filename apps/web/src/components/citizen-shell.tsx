"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LumiMark } from "./brand-marks";
import { ThemeInit } from "./theme-init";
import { ThemeToggle } from "./theme-toggle";
import { LogoutModal } from "./logout-modal";
import { dashboardPath, readSession } from "@/lib/warga-session";
import { regionDisplayLabel } from "@/lib/warga-region";

type CitizenSession = ReturnType<typeof readSession>;

/**
 * Citizen dashboard shell, modelled on a simple monitoring-portal layout: a
 * slim sidebar on desktop (Beranda, Peta, Lapor, Profil) that collapses into a
 * three-item bottom bar on phones. Deliberately unlike the ops workspace.
 */
export function CitizenShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<CitizenSession | null>(null);

  useEffect(() => { setSession(readSession()); }, []);

  // Logout confirmation lives in the themed modal; this is only the effect.

  const items = [
    { href: dashboardPath(session?.region), label: "Beranda", icon: <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" /> },
    { href: "/peta", label: "Peta", icon: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /></> },
    { href: "/lapor", label: "Lapor", icon: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></> },
    { href: "/profil", label: "Profil", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></> }
  ];

  const active = (href: string) => {
    const path = href.split("?")[0]!;
    if (path === "/wilayah/pontianak") return pathname === path || pathname.startsWith("/wilayah/");
    return pathname === path;
  };

  const nickname = session?.nickname || "Warga";

  return <><ThemeInit />
    <div className="citizen-layout">
      <aside className="citizen-sidebar" aria-label="Navigasi warga">
        <Link className="brand citizen-brand" href="/"><span className="brand-mark" aria-hidden><LumiMark /></span>LUMI Warga</Link>
        <nav className="citizen-nav">
          {items.map((item) => <Link key={item.label} className={active(item.href) ? "active" : ""} href={item.href}><svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg><span>{item.label}</span></Link>)}
        </nav>
        <div className="citizen-sidebar-foot">
          <ThemeToggle />
          <LogoutModal variant="warga" triggerClassName="citizen-logout" logout={() => { router.push("/"); window.location.reload(); }} />
        </div>
      </aside>

      <div className="citizen-content">
        <header className="citizen-topbar">
          <span className="citizen-topbar-hello">Halo, <strong>{nickname}</strong></span>
          <span className="citizen-topbar-region">Wilayah: <strong>{regionDisplayLabel(session?.region)}</strong></span>
        </header>
        <main className="citizen-main">{children}</main>
      </div>
    </div>

    <nav className="citizen-bottombar" aria-label="Navigasi warga (layar kecil)">
      {items.map((item) => <Link key={item.label} className={active(item.href) ? "active" : ""} href={item.href}><svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg><span>{item.label}</span></Link>)}
    </nav>
  </>;
}
