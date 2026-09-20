"use client";

import { DEMO_ROLES, type DemoRole } from "@/lib/demo-scenario";
import { useDemoScenario } from "./demo-scenario-store";

const labels: Record<DemoRole, string> = { SIMULATOR: "Simulator", DLH: "DLH", BPBD: "BPBD", APPROVER: "Approver", WARGA: "Warga" };

export function DemoRoleControl({ compact = false }: { compact?: boolean }) {
  const { role, setRole } = useDemoScenario();
  return <label className={`demo-role-control ${compact ? "is-compact" : ""}`}>Mode peran demo<select aria-label="Pilih peran demo lokal" value={role} onChange={(event) => setRole(event.target.value as DemoRole)}>{DEMO_ROLES.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>;
}
