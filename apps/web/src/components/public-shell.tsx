"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { shouldShowInternalNavigation } from "@/lib/demo-access";
import { getLocalDemoAccount } from "@/lib/local-demo-identity";
import { dashboardPath, readSession, clearSession } from "@/lib/warga-session";
import { ThemeInit } from "./theme-init";
import { LumiMark } from "./brand-marks";
import { useDemoScenario } from "./demo-scenario-store";
import { ThemeToggle } from "./theme-toggle";

/**
 * scope="warga" rethemes every shared public component on the citizen route
 * to the citizen identity; staff pages keep the ops look untouched. The
 * citizen header swaps ops chrome (role picker, staff links) for the citizen
 * brand and the session's Keluar button.
 */
export function PublicShell({ children, scope }: Readonly<{ children: React.ReactNode; scope?: "warga" }>) {
  const { role } = useDemoScenario();
  const router = useRouter();
  const account = getLocalDemoAccount(role);
  const citizen = scope === "warga" ? readSession() : null;

  const logout = () => {
    clearSession();
    router.push("/");
  };

  return <><ThemeInit /><div className={scope === "warga" ? "warga-scope" : undefined}><header className="public-shell topbar">{citizen
    ? <>
      <Link className="brand" href={dashboardPath(citizen.region)}><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI Warga</span></Link>
      <div className="nav warga-nav">
        <span className="session-role" title={citizen.email}>{citizen.nickname || citizen.email}</span>
        <ThemeToggle />
        <button type="button" className="warga-logout" onClick={logout}>Keluar</button>
      </div>
    </>
    : <>
      <Link className="brand" href="/"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI</span></Link>
      <div className="nav"><span className="session-role">{account.label}</span><ThemeToggle /><Link href="/panduan">Panduan</Link><Link href="/pengaturan">Pengaturan</Link>{shouldShowInternalNavigation(role) ? <Link href="/ops/insiden">Untuk petugas</Link> : null}</div>
    </>
  }</header><main className="public-shell page">{children}</main></div></>;
}
