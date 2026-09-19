import { OpsShell } from "@/components/ops-shell";
import { PublicationsBoard } from "@/components/publications-board";
export default function PublicationsPage() { return <OpsShell allowed={["DISKOMINFO"]}><PublicationsBoard /></OpsShell>; }
