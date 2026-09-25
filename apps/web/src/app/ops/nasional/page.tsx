import { NationalHotspotMap } from "@/components/national-hotspot-map";
import { OpsShell } from "@/components/ops-shell";
import { requireDemoRoles } from "@/lib/demo-route-guard";

export default async function NationalEscalationPage() {
  await requireDemoRoles(["BNPB", "KLHK", "DLH", "BPBD"]);
  return <OpsShell><section className="workflow-board">
    <header className="ops-header"><div><p className="eyebrow">Deteksi titik api nasional</p><h1>Peta Hotspot Nasional</h1><p className="muted">Setiap titik adalah deteksi hotspot dengan tingkat kepercayaan: hijau rendah (0–29%), kuning sedang (30–79%), merah tinggi atau bahaya (80–100%). Data simulasi untuk demo, pola provinsi mengikuti wilayah rawan.</p></div></header>
    <NationalHotspotMap />
  </section></OpsShell>;
}
