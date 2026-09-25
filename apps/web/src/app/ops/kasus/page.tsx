import { CaseBoard } from "@/components/case-board";
import { OpsShell } from "@/components/ops-shell";
import { requireDemoRoles } from "@/lib/demo-route-guard";

export default async function CasesPage() {
  await requireDemoRoles(["DLH", "BPBD"]);
  return <OpsShell><CaseBoard /></OpsShell>;
}
