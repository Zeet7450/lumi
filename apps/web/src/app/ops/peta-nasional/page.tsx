import { NationalIspuMap } from "@/components/national-ispu-map";
import { OpsShell } from "@/components/ops-shell";
import { requireDemoRoles } from "@/lib/demo-route-guard";

export default async function NationalMapPage() {
  // BPBD works from hotspots, not ISPU: its home is /ops/nasional.
  await requireDemoRoles(["DLH", "BNPB", "KLHK"]);
  return <OpsShell><section className="workflow-board">
    <header className="ops-header"><div><p className="eyebrow">Pemantauan udara nasional</p><h1>Peta ISPU 38 provinsi</h1><p className="muted">Skala warna resmi ISPU KLHK (Baik, Sedang, Tidak Sehat, Sangat Tidak Sehat, Berbahaya). Angka ISPU tercetak pada tiap titik; 1.000–10.000 titik simulasi dengan clustering, filter provinsi, dan sortir.</p></div></header>
    <NationalIspuMap />
  </section></OpsShell>;
}
