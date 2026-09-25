import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { DemoCasesProvider } from "@/components/demo-cases-store";
import { DemoScenarioProvider } from "@/components/demo-scenario-store";
import { getLocalDemoSession } from "@/lib/local-demo-auth";
import { themeBootstrapScript } from "@/lib/theme";

/* Body stays Inter (ops shares it); Space Grotesk is the citizen display voice. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "LUMI — Informasi Kualitas Udara",
  description: "Portal informasi kualitas udara dan ruang koordinasi LUMI."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getLocalDemoSession();
  return <html lang="id" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}><head><script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} /></head><body><DemoScenarioProvider sessionRole={session?.role} sessionProvince={session?.province}><DemoCasesProvider>{children}</DemoCasesProvider></DemoScenarioProvider></body></html>;
}
