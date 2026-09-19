import type { SimulationPreset } from "@lumi/contracts";
import { normalizeSnapshot, type RawSnapshot } from "./normalizer.js";
import type { Region, RuleInput } from "./model.js";
import { demoLocations } from "./demo-locations.js";

export const DEMO_NOW = "2026-09-08T06:00:00.000Z";

export const regions: Region[] = demoLocations.map((location) => ({
  id: `region-${location.regionSlug}`,
  slug: location.regionSlug,
  name: location.name,
  province: location.province
}));

function region(slug: string): Region {
  const result = regions.find((item) => item.slug === slug);
  if (!result) throw new Error(`Fixture region ${slug} tidak ditemukan.`);
  return result;
}

function raw(
  id: string,
  regionId: string,
  kind: RawSnapshot["kind"],
  value: number | string | null,
  referenceNow: string,
  minutesBeforeNow: number,
  extra: Partial<RawSnapshot> = {}
): RawSnapshot {
  return {
    id,
    regionId,
    kind,
    value,
    unit: kind === "PM25" ? "ug/m3" : undefined,
    source: "LUMI curated demo fixture",
    observedAt: minutesBefore(referenceNow, minutesBeforeNow),
    retrievedAt: referenceNow,
    mode: "SIMULATION",
    ...extra
  };
}

function minutesBefore(referenceNow: string, minutes: number): string {
  const milliseconds = new Date(referenceNow).getTime() - minutes * 60_000;
  if (!Number.isFinite(milliseconds)) throw new Error("Waktu fixture tidak valid.");
  return new Date(milliseconds).toISOString();
}

function scenario(slug: string, preset: SimulationPreset, mode: "LIVE" | "SIMULATION", now = DEMO_NOW): RuleInput {
  const target = region(slug);
  const snapshots: RawSnapshot[] = [];
  if (preset === "MONITOR") {
    snapshots.push(raw("obs-pontianak-pm25-001", target.id, "PM25", 20, now, 60, { pm25Source: "STATION" }));
  }
  if (preset === "VERIFY") {
    snapshots.push(raw("obs-kalteng-pm25-001", target.id, "PM25", 42, now, 60, { pm25Source: "STATION" }));
  }
  if (preset === "HIGH_PONTIANAK") {
    snapshots.push(
      raw("obs-pontianak-pm25-001", target.id, "PM25", 72, now, 120, { pm25Source: "STATION" }),
      raw("obs-pontianak-pm25-002", target.id, "PM25", 70, now, 45, { pm25Source: "STATION" }),
      raw("obs-pontianak-wind-001", target.id, "WIND", "barat daya", now, 40, { windSupportsImpact: true }),
      raw("obs-pontianak-hotspot-001", target.id, "HOTSPOT", 1, now, 90, { hotspotDistanceKm: 12, note: "Indikasi anomali panas." }),
      raw("obs-pontianak-hotspot-002", target.id, "HOTSPOT", 1, now, 80, { hotspotDistanceKm: 17, note: "Indikasi anomali panas." }),
      raw("obs-pontianak-hotspot-003", target.id, "HOTSPOT", 1, now, 70, { hotspotDistanceKm: 22, note: "Indikasi anomali panas." })
    );
  }
  if (preset === "STALE") {
    snapshots.push(raw("obs-pontianak-pm25-stale-001", target.id, "PM25", 72, now, 300, { pm25Source: "STATION" }));
  }
  return {
    region: target,
    mode,
    snapshots: snapshots.map((item) => normalizeSnapshot({ ...item, mode }, now)),
    now
  };
}

export function simulationFixture(preset: SimulationPreset): RuleInput {
  return scenario(preset === "VERIFY" ? "kalteng" : "pontianak", preset, "SIMULATION");
}

/** A separate curated DEMO source drives the government workflow; it is not a simulation run. */
export function liveDemoFixtures(now = new Date().toISOString()): RuleInput[] {
  return [scenario("pontianak", "HIGH_PONTIANAK", "LIVE", now), scenario("kalteng", "VERIFY", "LIVE", now)];
}
