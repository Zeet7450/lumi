import { AuditLogBoard } from "@/components/audit-log-board";
import { OpsShell } from "@/components/ops-shell";
import { requireDemoRoles } from "@/lib/demo-route-guard";

export default async function LogPage() {
  await requireDemoRoles(["DLH", "BPBD", "BNPB", "KLHK", "APPROVER", "SIMULATOR"]);
  return <OpsShell><AuditLogBoard /></OpsShell>;
}
