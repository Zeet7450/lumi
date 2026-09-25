import { PublicGuidance } from "@/components/public-guidance";
import { PublicStatus } from "@/components/public-status";
import { CitizenBeranda } from "@/components/citizen-beranda";
import { CitizenShell } from "@/components/citizen-shell";
import { CitizenRouteGuard } from "@/components/citizen-route-guard";

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // The citizen domain is deliberately separate from the ops domain: the
  // citizen session lives in localStorage, so an ops staff cookie in the same
  // browser must NOT bounce a citizen away from their own dashboard. The
  // client-side guard below fails closed until the citizen session is known.
  // Reporting lives on /lapor only; Beranda reads, it does not collect.
  return <CitizenShell>
    <CitizenRouteGuard>
      <CitizenBeranda regionSlug={slug} />
      <PublicStatus slug={slug} details />
      <PublicGuidance />
    </CitizenRouteGuard>
  </CitizenShell>;
}
