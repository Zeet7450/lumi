import { SimulationCenter } from "@/components/simulation-center";
import { SimulatorShell } from "@/components/simulator-shell";
import { requireDemoRoles } from "@/lib/demo-route-guard";

export default async function SimulationPage() {
  await requireDemoRoles(["SIMULATOR"]);
  return <SimulatorShell><SimulationCenter /></SimulatorShell>;
}
