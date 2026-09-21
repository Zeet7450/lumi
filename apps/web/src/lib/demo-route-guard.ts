import { redirect } from "next/navigation";
import type { DemoRole } from "./demo-scenario";
import { getLocalDemoSession } from "./local-demo-auth";

export async function requireDemoRoles(roles: readonly DemoRole[]) {
  const session = await getLocalDemoSession();
  if (!session) redirect("/");
  if (!roles.includes(session.role)) redirect(session.destination);
  return session;
}
