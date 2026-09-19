import Link from "next/link";
import { ThemeInit } from "./theme-init";
import { LumiMark } from "./brand-marks";

export function PublicShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><ThemeInit /><header className="public-shell topbar"><Link className="brand" href="/"><span className="brand-mark" aria-hidden><LumiMark /></span><span>LUMI</span></Link><div className="nav"><Link href="/panduan">Panduan</Link><Link href="/pengaturan">Pengaturan</Link><Link href="/ops/login">Untuk petugas</Link></div></header><main className="public-shell page">{children}</main></>;
}
