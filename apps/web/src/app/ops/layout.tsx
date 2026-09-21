import { InternalDemoGate } from "@/components/internal-demo-gate";
import { getLocalDemoSession } from "@/lib/local-demo-auth";
import { redirect } from "next/navigation";

export default async function OpsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getLocalDemoSession();
  if (!session) redirect("/");
  if (session.role === "WARGA") redirect("/wilayah/pontianak");
  return <InternalDemoGate>{children}</InternalDemoGate>;
}
