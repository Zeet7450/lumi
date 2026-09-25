import { cookies } from "next/headers";
import type { DemoRole } from "./demo-scenario";
import { getLocalDemoAccount, localDemoAccountByEmail } from "./local-demo-identity";

export { getLocalDemoAccount, localDemoAccounts, localDemoAccountByEmail, type LocalDemoAccount } from "./local-demo-identity";

export const LOCAL_DEMO_COOKIE = "lumi-local-demo-role";

export async function getLocalDemoSession(): Promise<import("./local-demo-identity").LocalDemoAccount | null> {
  const value = (await cookies()).get(LOCAL_DEMO_COOKIE)?.value;
  if (!value) return null;
  // New sessions carry the email (provincial officers share a role). Old
  // cookies still hold a bare role name, so resolve that way as a fallback.
  return localDemoAccountByEmail(value) ?? getLocalDemoAccount(value as DemoRole);
}
