import { PublicGuidance } from "@/components/public-guidance";
import { PublicShell } from "@/components/public-shell";
import { PublicStatus } from "@/components/public-status";

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <PublicShell><PublicStatus slug={slug} details /><PublicGuidance /></PublicShell>; }
