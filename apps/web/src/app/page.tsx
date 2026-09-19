import { PublicGuidance } from "@/components/public-guidance";
import { PublicShell } from "@/components/public-shell";
import { PublicStatus } from "@/components/public-status";
import { redirect } from "next/navigation";

export default function HomePage() {
  if (process.env.LUMI_ENTRY === "ops" || process.env.LUMI_ENTRY === "simulator") redirect("/ops/login");
  return <PublicShell><PublicStatus /><PublicGuidance /><section className="section callout"><strong>Catatan penting.</strong> LUMI tidak memberi perintah evakuasi otomatis. Ikuti arahan resmi pemerintah daerah bila situasi berubah.</section></PublicShell>;
}
