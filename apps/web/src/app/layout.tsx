import type { Metadata } from "next";
import "./globals.css";
import { DemoScenarioProvider } from "@/components/demo-scenario-store";
import { SimulationModeBanner } from "@/components/simulation-mode-banner";

export const metadata: Metadata = {
  title: "LUMI — Informasi Kualitas Udara",
  description: "Portal informasi kualitas udara dan ruang koordinasi LUMI."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body><DemoScenarioProvider><SimulationModeBanner />{children}</DemoScenarioProvider></body></html>;
}
