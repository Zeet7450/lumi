import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUMI — Informasi Kualitas Udara",
  description: "Portal informasi kualitas udara dan ruang koordinasi LUMI."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body>{children}</body></html>;
}
