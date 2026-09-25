import { CitizenReportsBoard } from "@/components/citizen-reports-board";
import { OpsShell } from "@/components/ops-shell";
import { requireDemoRoles } from "@/lib/demo-route-guard";

export default async function CitizenReportsPage() {
  const session = await requireDemoRoles(["BPBD"]);
  return <OpsShell><CitizenReportsBoard province={session.province ?? "Kalimantan Barat"} /></OpsShell>;
}
