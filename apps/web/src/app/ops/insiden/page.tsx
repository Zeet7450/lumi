import { IncidentsBoard } from "@/components/incidents-board";
import { OpsShell } from "@/components/ops-shell";
import { requireDemoRoles } from "@/lib/demo-route-guard";

export default async function IncidentsPage() {
  await requireDemoRoles(["DLH", "BPBD"]);
  return <OpsShell><IncidentsBoard /></OpsShell>;
}
