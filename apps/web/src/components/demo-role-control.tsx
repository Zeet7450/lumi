"use client";

import { DEMO_ROLES, type DemoRole } from "@/lib/demo-scenario";
import { useDemoScenario } from "./demo-scenario-store";

const labels: Record<DemoRole, string> = { SIMULATOR: "Simulator", DLH: "DLH Provinsi", BPBD: "BPBD Provinsi", BNPB: "BNPB", KLHK: "KLHK", APPROVER: "Approver", WARGA: "Warga" };

export function DemoRoleControl({ compact = false }: { compact?: boolean }) {
  const { role, setRole } = useDemoScenario();
  return <label className={`demo-role-control ${compact ? "is-compact" : ""}`}>Mode peran<select aria-label="Pilih peran petugas" value={role} onChange={(event) => setRole(event.target.value as DemoRole)}>{DEMO_ROLES.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>;
}
