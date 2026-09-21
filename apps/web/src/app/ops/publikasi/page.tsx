import { OpsShell } from "@/components/ops-shell";
import { PublicationsBoard } from "@/components/publications-board";
import { requireDemoRoles } from "@/lib/demo-route-guard";

export default async function PublicationsPage() {
  await requireDemoRoles(["APPROVER"]);
  return <OpsShell allowed={["DISKOMINFO"]}><PublicationsBoard /></OpsShell>;
}
