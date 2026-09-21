import { PublicGuidance } from "@/components/public-guidance";
import { PublicShell } from "@/components/public-shell";
import { PublicStatus } from "@/components/public-status";
import { getLocalDemoSession } from "@/lib/local-demo-auth";
import { redirect } from "next/navigation";

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) { const [session, { slug }] = await Promise.all([getLocalDemoSession(), params]); if (!session) redirect("/"); if (session.role !== "WARGA") redirect(session.destination); return <PublicShell><PublicStatus slug={slug} details /><PublicGuidance /></PublicShell>; }
