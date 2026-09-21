import { cookies } from "next/headers";
import type { DemoRole } from "./demo-scenario";
import { getLocalDemoAccount } from "./local-demo-identity";

export { getLocalDemoAccount, localDemoAccounts, type LocalDemoAccount } from "./local-demo-identity";

export const LOCAL_DEMO_COOKIE = "lumi-local-demo-role";

export async function getLocalDemoSession(): Promise<import("./local-demo-identity").LocalDemoAccount | null> {
  const role = (await cookies()).get(LOCAL_DEMO_COOKIE)?.value as DemoRole | undefined;
  return role ? getLocalDemoAccount(role) : null;
}
