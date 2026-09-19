"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { driver } from "driver.js";
import { useOpsSession } from "@/lib/ops-session";
import { logout, type Role } from "@/lib/lumi";
import { ThemeInit } from "./theme-init";
import { LumiMark } from "./brand-marks";

const labels: Record<Role, string> = { DLH: "Operator DLH", BPBD: "Koordinator BPBD", DINKES: "Reviewer Dinkes", DISKOMINFO: "Approver Diskominfo", ADMIN_DEMO: "Admin simulator" };

function Tour({ enabled }: { enabled: boolean }) {
  const search = useSearchParams();
  useEffect(() => {
    if (!enabled || search.get("tur") !== "1") return;
    const timer = window.setTimeout(() => {
      if (!document.querySelector("[data-tour='priority']")) return;
      driver({
        popoverClass: "tour-popover",
        showProgress: true,
        steps: [
          { element: "[data-tour='priority']", popover: { title: "Urutan prioritas", description: "Mulai dari wilayah dengan kebutuhan respons paling tinggi.", side: "bottom", align: "start" } },
          { element: "[data-tour='reason']", popover: { title: "Alasan keputusan", description: "Petugas dapat melihat ringkasan alasan tanpa menafsirkan data mentah sendiri.", side: "bottom", align: "start" } },
          { element: "[data-tour='help']", popover: { title: "Bantuan", description: "Tur ini dapat dibuka kembali kapan saja dari tombol Bantuan.", side: "bottom", align: "end" } }
        ]
      }).drive();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [enabled, search]);
  return null;
}

export function OpsShell({ children, allowed }: Readonly<{ children: React.ReactNode; allowed?: Role[] }>) {
  const { session, clear } = useOpsSession();
  const pathname = usePathname();
  const router = useRouter();
  const permittedRoles = allowed ?? ["DLH", "BPBD", "DINKES", "DISKOMINFO"];
  const denied = !!session && !permittedRoles.includes(session.actor.role);
  function startTour() { router.push("/ops/insiden?tur=1"); }
  async function signOut() {
    try { await logout(); }
    finally { clear(); router.push("/ops/login"); }
  }
  if (!session) return <><ThemeInit /><main className="login-wrap"><section className="login-card"><p className="eyebrow">LUMI Ops</p><h1>Masuk terlebih dahulu</h1><p className="muted">Dashboard operasional hanya untuk petugas yang berwenang.</p><Link className="button" href="/ops/login">Ke halaman masuk</Link></section></main></>;
  if (denied) return <><ThemeInit /><main className="login-wrap"><section className="login-card"><p className="eyebrow">Akses dibatasi</p><h1>Peran ini tidak memiliki akses ke halaman tersebut.</h1><p className="muted">Masuk sebagai peran yang sesuai untuk melanjutkan.</p><Link className="button" href="/ops/insiden">Kembali ke antrean</Link></section></main></>;
  return <><ThemeInit /><Tour enabled /><div className="ops-layout"><aside className="ops-sidebar"><Link className="brand" href="/ops/insiden"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI Ops</span></Link><p className="muted" style={{ margin: "12px 0 0" }}>{labels[session.actor.role]}{session.preview ? " · pratinjau" : ""}</p><nav className="nav" aria-label="Navigasi petugas"><Link className={pathname === "/ops/insiden" ? "active" : ""} href="/ops/insiden">Antrean insiden</Link>{session.actor.role === "DISKOMINFO" && <Link href="/ops/publikasi">Publikasi</Link>}<Link className={pathname === "/ops/pengaturan" ? "active" : ""} href="/ops/pengaturan">Pengaturan</Link></nav><div className="sidebar-utilities"><button data-tour="help" className="text-utility" onClick={startTour}>Bantuan & tur</button><button className="text-utility" onClick={signOut}>Keluar</button></div></aside><main className="ops-main">{children}</main></div></>;
}
