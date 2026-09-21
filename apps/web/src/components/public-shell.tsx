"use client";

import Link from "next/link";
import { shouldShowInternalNavigation } from "@/lib/demo-access";
import { ThemeInit } from "./theme-init";
import { LumiMark } from "./brand-marks";
import { useDemoScenario } from "./demo-scenario-store";
import { ThemeToggle } from "./theme-toggle";
import { LocalDemoLogout } from "./local-demo-logout";

export function PublicShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { role } = useDemoScenario();
  return <><ThemeInit /><header className="public-shell topbar"><Link className="brand" href="/"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI</span></Link><div className="nav"><span className="session-role">Akun · {role}</span><ThemeToggle /><Link href="/panduan">Panduan</Link><Link href="/pengaturan">Pengaturan</Link>{shouldShowInternalNavigation(role) ? <Link href="/ops/insiden">Untuk petugas</Link> : null}<LocalDemoLogout /></div></header><main className="public-shell page">{children}</main></>;
}
