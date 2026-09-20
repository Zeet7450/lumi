"use client";

import Link from "next/link";
import { canRenderInternalDemo } from "@/lib/demo-access";
import { DemoRoleControl } from "./demo-role-control";
import { useDemoScenario } from "./demo-scenario-store";
import { ThemeInit } from "./theme-init";

/**
 * This is a route boundary for browser-local demo roles, not authentication.
 * It keeps Warga from rendering drafts or operational surfaces on direct URLs.
 */
export function InternalDemoGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const { role, isReady } = useDemoScenario();
  if (canRenderInternalDemo(role, isReady)) return <>{children}</>;

  if (!isReady) return <><ThemeInit /><main className="demo-access-gate" aria-live="polite"><p className="muted">Memeriksa peran demo lokal…</p></main></>;

  return <><ThemeInit /><main className="demo-access-gate"><section className="demo-access-card" aria-labelledby="warga-boundary-title"><p className="eyebrow">Portal Warga</p><h1 id="warga-boundary-title">Ruang petugas tidak tersedia untuk peran Warga</h1><p className="muted">Draf informasi, bukti internal, dan tindakan operasional tidak ditampilkan pada peran ini. Kembali ke portal publik untuk melihat informasi yang sudah disetujui.</p><div className="demo-access-actions"><Link className="button" href="/">Kembali ke portal warga</Link><DemoRoleControl /></div><p className="freshness">Selector peran tetap tersedia agar alur demo lokal dapat dilanjutkan dengan peran petugas yang sesuai.</p></section></main></>;
}
