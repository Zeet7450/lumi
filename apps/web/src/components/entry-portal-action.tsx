"use client";

import Link from "next/link";
import { useDemoScenario } from "./demo-scenario-store";

export function EntryPortalAction() {
  const { setRole } = useDemoScenario();
  return <Link className="button secondary" href="/wilayah/pontianak" onClick={() => setRole("WARGA")}>Portal Warga</Link>;
}
