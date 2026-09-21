"use client";

import Link from "next/link";
import { LumiMark } from "./brand-marks";
import { ThemeInit } from "./theme-init";
import { useDemoScenario } from "./demo-scenario-store";
import { getLocalDemoAccount } from "@/lib/local-demo-identity";

export function SimulatorShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { role } = useDemoScenario();
  const account = getLocalDemoAccount(role);
  return <><ThemeInit /><div className="simulator-shell"><header className="simulator-header"><Link className="brand" href="/ops/simulasi"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI Simulator</span></Link><div className="simulator-utilities"><span className="session-role">{account.label}</span><Link className="text-utility" href="/ops/insiden">Ke LUMI Ops</Link></div></header><main className="simulator-main">{children}</main></div></>;
}
