import { InternalDemoGate } from "@/components/internal-demo-gate";
import { getLocalDemoSession } from "@/lib/local-demo-auth";
import { redirect } from "next/navigation";

export default async function OpsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getLocalDemoSession();
  // The login route lives beneath this layout. Individual operational pages
  // enforce their own role requirement, so the login screen must remain public.
  if (!session) return <>{children}</>;
  if (session.role === "WARGA") redirect("/wilayah/pontianak");
  return <InternalDemoGate>{children}</InternalDemoGate>;
}
