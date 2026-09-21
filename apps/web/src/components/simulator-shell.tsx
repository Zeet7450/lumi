"use client";

import Link from "next/link";
import { LumiMark } from "./brand-marks";
import { ThemeInit } from "./theme-init";
import { useDemoScenario } from "./demo-scenario-store";
import { getLocalDemoAccount } from "@/lib/local-demo-identity";

export function SimulatorShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { role } = useDemoScenario();
  const account = getLocalDemoAccount(role);
  return <><ThemeInit /><div className="simulator-shell"><header className="simulator-header"><div className="brand"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI Simulator</span></div><div className="simulator-utilities"><nav className="simulator-navigation" aria-label="Navigasi Simulator"><Link className="text-utility" href="/ops/simulasi">Simulation Center</Link><Link className="text-utility" href="/ops/pengaturan">Pengaturan</Link></nav><span className="session-role">{account.label}</span></div></header><main className="simulator-main">{children}</main></div></>;
}
