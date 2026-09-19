import { IncidentsBoard } from "@/components/incidents-board";
import { OpsDashboard } from "@/components/ops-dashboard";
import { OpsShell } from "@/components/ops-shell";
export default function IncidentsPage() { return <OpsShell><OpsDashboard /><div className="incident-section"><IncidentsBoard /></div></OpsShell>; }
