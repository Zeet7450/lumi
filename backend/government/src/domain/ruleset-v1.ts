import { aqiFromPm25, type PriorityTier, type Role } from "@lumi/contracts";
import type { FreshDecision, NoFreshDecision, RuleInput, RuleResult, Snapshot } from "./model.js";

export const POLICY_VERSION = "ruleset-v1" as const;

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function numeric(snapshot: Snapshot): number | null {
  return typeof snapshot.value === "number" && Number.isFinite(snapshot.value) ? snapshot.value : null;
}

function ownersFor(tier: PriorityTier): Role[] {
  if (tier === "HIGH_RESPONSE") return ["DLH", "BPBD", "DINKES", "DISKOMINFO"];
  if (tier === "VERIFY") return ["DLH", "DINKES"];
  return ["DLH"];
}

function decision(
  tier: PriorityTier,
  rationale: string[],
  evidenceIds: string[],
  dataGaps: string[]
): FreshDecision {
  return {
    kind: "DECISION",
    tier,
    rationale,
    evidenceIds: uniqueSorted(evidenceIds),
    dataGaps,
    ownerHints: ownersFor(tier),
    policyVersion: POLICY_VERSION
  };
}

function hazardLabel(type: string | undefined): string {
  if (type === "FIRE") return "indikasi kebakaran";
  if (type === "VOLCANIC_ASH") return "indikasi abu vulkanik";
  if (type === "FLOOD") return "indikasi banjir";
  return "indikasi kejadian";
}

/**
 * Pure, versioned policy. The stale branch intentionally has no tier, so it
 * cannot silently lower a prior LIVE decision to MONITOR.
 */
export function evaluateRulesetV1(input: RuleInput): RuleResult {
  const fresh = input.snapshots.filter((snapshot) => snapshot.freshness === "FRESH");
  const pm25 = input.snapshots.filter((snapshot) => snapshot.kind === "PM25");
  const freshPm25 = fresh.filter((snapshot) => snapshot.kind === "PM25" && numeric(snapshot) !== null);
  const freshStation = freshPm25.filter((snapshot) => snapshot.pm25Source !== "MODEL");
  const freshModel = freshPm25.filter((snapshot) => snapshot.pm25Source === "MODEL");
  const freshWind = fresh.filter((snapshot) => snapshot.kind === "WIND");
  const freshHotspots = fresh.filter((snapshot) => snapshot.kind === "HOTSPOT");
  const freshHazards = fresh.filter((snapshot) => snapshot.kind === "HAZARD");
  const mostSevereHazard = freshHazards.reduce<Snapshot | undefined>((highest, snapshot) =>
    !highest || (numeric(snapshot) ?? 0) > (numeric(highest) ?? 0) ? snapshot : highest, undefined);
  const dataGaps: string[] = [];

  // A simulator indication is not a confirmed disaster. It only establishes a
  // minimum operational tier and never weakens stronger air-quality evidence.
  if (mostSevereHazard && (numeric(mostSevereHazard) ?? 0) >= 3) {
    return decision("HIGH_RESPONSE", [
      `${hazardLabel(mostSevereHazard.hazardType)} tingkat ${numeric(mostSevereHazard)} memerlukan respons tinggi dan verifikasi petugas.`
    ], freshHazards.map((item) => item.id), pm25.length === 0 ? ["PM2.5 tidak tersedia."] : []);
  }
  if (mostSevereHazard && (numeric(mostSevereHazard) ?? 0) >= 1 && pm25.length === 0) {
    return decision("VERIFY", [
      `${hazardLabel(mostSevereHazard.hazardType)} tingkat ${numeric(mostSevereHazard)} memerlukan verifikasi petugas.`
    ], freshHazards.map((item) => item.id), ["PM2.5 tidak tersedia."]);
  }

  if (pm25.length === 0) {
    if (freshHotspots.length >= 1) {
      return decision(
        "VERIFY",
        ["Indikasi anomali panas memerlukan verifikasi; ini bukan kebakaran terkonfirmasi."],
        freshHotspots.map((item) => item.id),
        ["PM2.5 tidak tersedia."]
      );
    }
    return noFresh("UNAVAILABLE", ["PM2.5 tidak tersedia."], []);
  }
  if (freshPm25.length === 0) {
    if (mostSevereHazard) {
      return decision("VERIFY", [
        `${hazardLabel(mostSevereHazard.hazardType)} tingkat ${numeric(mostSevereHazard)} memerlukan verifikasi petugas.`
      ], freshHazards.map((item) => item.id), ["Data PM2.5 perlu diperbarui."]);
    }
    return noFresh("STALE", ["Data PM2.5 perlu diperbarui; keputusan terakhir dipertahankan."], pm25.map((item) => item.id));
  }

  if (freshWind.length === 0) dataGaps.push("Data angin belum tersedia atau perlu diperbarui.");
  if (freshHotspots.length === 0) dataGaps.push("Hotspot belum tersedia untuk periode ini.");

  const freshValues = freshPm25.map(numeric).filter((value): value is number => value !== null);
  const highestPm25 = Math.max(...freshValues);
  const highestAqi = aqiFromPm25(highestPm25).aqi;
  const highStation = freshStation.filter((snapshot) => (numeric(snapshot) ?? -Infinity) >= 55.5);
  const highAtLeastHourApart = highStation.some((first, index) =>
    highStation.slice(index + 1).some((second) =>
      Math.abs(new Date(first.observedAt).getTime() - new Date(second.observedAt).getTime()) >= 60 * 60_000
    )
  );
  const relevantCluster = freshHotspots.filter((snapshot) => (snapshot.hotspotDistanceKm ?? Infinity) <= 25).length >= 3;
  const windSupportsImpact = freshWind.some((snapshot) => snapshot.windSupportsImpact === true);
  const highEvidence = [...highStation.map((snapshot) => snapshot.id), ...freshHotspots.map((snapshot) => snapshot.id), ...freshWind.map((snapshot) => snapshot.id)];

  if (highestAqi >= 151) {
    return decision("HIGH_RESPONSE", ["AQI sangat tinggi dan masih segar; koordinasi respons diperlukan."], highEvidence, dataGaps);
  }
  if (input.mode === "SIMULATION" && freshPm25.some((snapshot) => (numeric(snapshot) ?? -Infinity) >= 150)) {
    return decision("HIGH_RESPONSE", ["PM2.5 fixture simulasi sangat tinggi dan masih segar."], freshPm25.map((item) => item.id), dataGaps);
  }
  if (highStation.length > 0 && highAtLeastHourApart) {
    return decision("HIGH_RESPONSE", ["Dua pembacaan PM2.5 tinggi yang segar berjarak setidaknya satu jam."], highEvidence, dataGaps);
  }
  if (highStation.length > 0 && relevantCluster && windSupportsImpact) {
    return decision("HIGH_RESPONSE", ["PM2.5 tinggi didukung cluster indikator panas dan arah angin yang relevan."], highEvidence, dataGaps);
  }
  if (highestPm25 >= 55.5) {
    const modelOnly = freshStation.length === 0 && freshModel.length > 0;
    return decision(
      "VERIFY",
      [modelOnly ? "Estimasi PM2.5 tinggi memerlukan bukti segar tambahan." : "PM2.5 tinggi perlu verifikasi sebelum eskalasi."],
      freshPm25.map((item) => item.id),
      dataGaps
    );
  }
  if (freshHotspots.length >= 1) {
    return decision(
      "VERIFY",
      ["Indikasi anomali panas memerlukan verifikasi; ini bukan kebakaran terkonfirmasi."],
      [...freshPm25.map((item) => item.id), ...freshHotspots.map((item) => item.id)],
      dataGaps
    );
  }
  if (mostSevereHazard) {
    return decision("VERIFY", [
      `${hazardLabel(mostSevereHazard.hazardType)} tingkat ${numeric(mostSevereHazard)} memerlukan verifikasi petugas.`
    ], [...freshPm25.map((item) => item.id), ...freshHazards.map((item) => item.id)], dataGaps);
  }
  if (highestPm25 >= 35.5) {
    return decision("VERIFY", ["PM2.5 memburuk dan masih segar."], freshPm25.map((item) => item.id), dataGaps);
  }
  return decision("MONITOR", ["PM2.5 segar berada pada rentang pantau."], freshPm25.map((item) => item.id), dataGaps);
}

function noFresh(freshness: NoFreshDecision["freshness"], dataGaps: string[], evidenceIds: string[]): NoFreshDecision {
  return { kind: "NO_FRESH_DECISION", freshness, dataGaps, evidenceIds: uniqueSorted(evidenceIds), policyVersion: POLICY_VERSION };
}
