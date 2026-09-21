import { redirect } from "next/navigation";
import { getLocalDemoSession } from "@/lib/local-demo-auth";

export default async function OpsPage() {
  const session = await getLocalDemoSession();
  redirect(session?.destination ?? "/");
}
