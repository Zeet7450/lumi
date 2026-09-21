import { cookies } from "next/headers";
import type { DemoRole } from "./demo-scenario";

export const LOCAL_DEMO_COOKIE = "lumi-local-demo-role";

export const localDemoAccounts = {
  "simulator@demo.lumi.id": { role: "SIMULATOR", destination: "/ops/simulasi", label: "Simulator" },
  "operator.dlh@demo.lumi.id": { role: "DLH", destination: "/ops/insiden", label: "DLH" },
  "koordinator.bpbd@demo.lumi.id": { role: "BPBD", destination: "/ops/insiden", label: "BPBD" },
  "approver.diskominfo@demo.lumi.id": { role: "APPROVER", destination: "/ops/publikasi", label: "Approver" },
  "amelia.warga@demo.lumi.id": { role: "WARGA", destination: "/wilayah/pontianak", label: "Warga" }
} as const satisfies Record<string, { role: DemoRole; destination: string; label: string }>;

export type LocalDemoAccount = (typeof localDemoAccounts)[keyof typeof localDemoAccounts];

export async function getLocalDemoSession(): Promise<LocalDemoAccount | null> {
  const role = (await cookies()).get(LOCAL_DEMO_COOKIE)?.value as DemoRole | undefined;
  return Object.values(localDemoAccounts).find((account) => account.role === role) ?? null;
}
