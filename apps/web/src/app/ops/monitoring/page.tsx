import { MonitoringBoard } from "@/components/monitoring-board";
import { OpsShell } from "@/components/ops-shell";
import { requireDemoRoles } from "@/lib/demo-route-guard";

export default async function MonitoringPage() {
  await requireDemoRoles(["KLHK"]);
  return <OpsShell><MonitoringBoard /></OpsShell>;
}
