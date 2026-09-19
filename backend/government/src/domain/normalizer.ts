import type { DataMode, EvidenceKind, HazardType } from "@lumi/contracts";
import type { Snapshot } from "./model.js";

export interface RawSnapshot {
  id: string;
  regionId: string;
  kind: EvidenceKind;
  value: string | number | null;
  unit?: string;
  source: string;
  observedAt: string;
  retrievedAt: string;
  mode: DataMode;
  note?: string;
  pm25Source?: "STATION" | "MODEL";
  windSupportsImpact?: boolean;
  hotspotDistanceKm?: number;
  locationId?: string;
  latitude?: number;
  longitude?: number;
  impactRadiusKm?: number;
  hazardType?: HazardType;
}

function ageMilliseconds(from: string, to: string): number {
  return new Date(to).getTime() - new Date(from).getTime();
}

/** Computes freshness at the time data is read or normalized. */
export function freshnessAt(raw: Pick<RawSnapshot, "kind" | "observedAt" | "retrievedAt" | "pm25Source">, now: string): Snapshot["freshness"] {
  const age = raw.kind === "PM25" && raw.pm25Source === "MODEL"
    ? ageMilliseconds(raw.retrievedAt, now)
    : ageMilliseconds(raw.observedAt, now);
  if (!Number.isFinite(age) || age < 0) return "UNAVAILABLE";
  const limit = raw.kind === "PM25"
    ? raw.pm25Source === "MODEL" ? 15 * 60 * 60_000 : 3 * 60 * 60_000
    : raw.kind === "HOTSPOT" ? 12 * 60 * 60_000 : 6 * 60 * 60_000;
  return age <= limit ? "FRESH" : "STALE";
}

/** Normalizes fixture/provider-shaped input without retaining raw provider payloads. */
export function normalizeSnapshot(raw: RawSnapshot, now: string): Snapshot {
  return {
    id: raw.id,
    regionId: raw.regionId,
    kind: raw.kind,
    value: raw.value,
    unit: raw.unit,
    source: raw.source,
    observedAt: raw.observedAt,
    retrievedAt: raw.retrievedAt,
    freshness: freshnessAt(raw, now),
    mode: raw.mode,
    note: raw.note,
    pm25Source: raw.pm25Source,
    windSupportsImpact: raw.windSupportsImpact,
    hotspotDistanceKm: raw.hotspotDistanceKm,
    locationId: raw.locationId,
    latitude: raw.latitude,
    longitude: raw.longitude,
    impactRadiusKm: raw.impactRadiusKm,
    hazardType: raw.hazardType
  };
}
