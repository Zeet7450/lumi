import type { DemoRole } from "./demo-scenario";

export const localDemoAccounts = {
  "simulator@demo.lumi.id": { email: "simulator@demo.lumi.id", role: "SIMULATOR", destination: "/ops/simulasi", label: "Operator Simulator" },
  "operator.dlh@demo.lumi.id": { email: "operator.dlh@demo.lumi.id", role: "DLH", destination: "/ops/insiden", label: "Operator DLH" },
  "koordinator.bpbd@demo.lumi.id": { email: "koordinator.bpbd@demo.lumi.id", role: "BPBD", destination: "/ops/insiden", label: "Koordinator BPBD" },
  "approver.diskominfo@demo.lumi.id": { email: "approver.diskominfo@demo.lumi.id", role: "APPROVER", destination: "/ops/publikasi", label: "Approver Diskominfo" },
  "amelia.warga@demo.lumi.id": { email: "amelia.warga@demo.lumi.id", role: "WARGA", destination: "/wilayah/pontianak", label: "Amelia — Warga" }
} as const satisfies Record<string, { email: string; role: DemoRole; destination: string; label: string }>;

export type LocalDemoAccount = (typeof localDemoAccounts)[keyof typeof localDemoAccounts];

export function getLocalDemoAccount(role: DemoRole): LocalDemoAccount {
  return Object.values(localDemoAccounts).find((account) => account.role === role) ?? localDemoAccounts["simulator@demo.lumi.id"];
}
