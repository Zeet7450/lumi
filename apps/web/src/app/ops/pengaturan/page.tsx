import { OpsShell } from "@/components/ops-shell";
import { SettingsPanel } from "@/components/settings-panel";
import { requireDemoRoles } from "@/lib/demo-route-guard";
export default async function OpsSettingsPage() { await requireDemoRoles(["SIMULATOR", "DLH", "BPBD", "APPROVER"]); return <OpsShell><SettingsPanel audience="petugas" /></OpsShell>; }
