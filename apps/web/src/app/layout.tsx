import type { Metadata } from "next";
import "./globals.css";
import { DemoScenarioProvider } from "@/components/demo-scenario-store";
import { getLocalDemoSession } from "@/lib/local-demo-auth";

export const metadata: Metadata = {
  title: "LUMI — Informasi Kualitas Udara",
  description: "Portal informasi kualitas udara dan ruang koordinasi LUMI."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getLocalDemoSession();
  return <html lang="id" suppressHydrationWarning><body><DemoScenarioProvider sessionRole={session?.role}>{children}</DemoScenarioProvider></body></html>;
}
