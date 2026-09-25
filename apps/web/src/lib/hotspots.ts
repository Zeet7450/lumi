import type { ProvinceFeature } from "./national-points";

/**
 * Synthetic hotspot layer for the BPBD/BNPB view. Each hotspot carries a fire-
 * detection confidence percentage; the colour bands follow the operational
 * convention: green under 30% (low trust), yellow to 79%, red from 80%.
 */
export type Hotspot = {
  id: string;
  provinceSlug: string;
  province: string;
  name: string;
  lat: number;
  lng: number;
  /** Fire-detection confidence, 0-100. */
  confidence: number;
};

export type ConfidenceSort = "NAME_ASC" | "CONF_ASC" | "CONF_DESC";

/** Seeded PRNG — identical to the ISPU generator so layers stay reproducible. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

type Position = [number, number];
type Ring = Position[];

function polygonsOf(feature: ProvinceFeature): Ring[][] {
  return feature.geometry.type === "Polygon" ? [feature.geometry.coordinates as Ring[]] : (feature.geometry.coordinates as Ring[][]);
}

function ringBounds(ring: Ring): [number, number, number, number] {
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLng, minLat, maxLng, maxLat];
}

function insideRing(ring: Ring, lng: number, lat: number): boolean {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [lngA, latA] = ring[index]!;
    const [lngB, latB] = ring[previous]!;
    if ((latA > lat) !== (latB > lat) && lng < ((lngB - lngA) * (lat - latA)) / (latB - latA) + lngA) inside = !inside;
  }
  return inside;
}

function insidePolygon(polygon: Ring[], lng: number, lat: number): boolean {
  if (!polygon.length || !insideRing(polygon[0]!, lng, lat)) return false;
  return !polygon.slice(1).some((hole) => insideRing(hole, lng, lat));
}

/** Haze-prone provinces burn more, mirroring the ISPU risk weighting. */
function hotRisk(province: string): number {
  if (/^(Kalimantan|Sumatera|Riau|Jambi|Aceh|Bengkulu|Lampung)/.test(province)) return 1.3;
  if (/^(Maluku|Papua|Nusa Tenggara)/.test(province)) return 2.6;
  return 1.9;
}

export const HOTSPOT_DENSITIES = [500, 1_000, 2_000, 5_000] as const;

/**
 * Distributes synthetic hotspots the same way the ISPU generator distributes
 * stations (area-weighted, province-contained) so both layers cover the map
 * comparably.
 */
export function generateHotspots(features: ProvinceFeature[], total = 2_000): Hotspot[] {
  if (!features.length) return [];
  const areas = features.map((feature) => polygonsOf(feature).reduce((sum, polygon) => {
    const [minLng, minLat, maxLng, maxLat] = ringBounds(polygon[0]!);
    return sum + Math.max(0.0004, (maxLng - minLng) * (maxLat - minLat));
  }, 0));
  const totalArea = areas.reduce((sum, value) => sum + value, 0);
  const hotspots: Hotspot[] = [];
  features.forEach((feature, featureIndex) => {
    const share = Math.max(2, Math.round((areas[featureIndex]! / totalArea) * total));
    const polygons = polygonsOf(feature);
    const polygonAreas = polygons.map((polygon) => {
      const [minLng, minLat, maxLng, maxLat] = ringBounds(polygon[0]!);
      return Math.max(0.0004, (maxLng - minLng) * (maxLat - minLat));
    });
    const polygonTotal = polygonAreas.reduce((sum, value) => sum + value, 0);
    const random = mulberry32(seedFrom(`hotspot:${feature.slug}:${total}`));
    const risk = hotRisk(feature.name);
    for (let index = 0; index < share; index += 1) {
      let target = random() * polygonTotal;
      let polygonIndex = 0;
      while (polygonIndex < polygons.length - 1 && target > polygonAreas[polygonIndex]!) { target -= polygonAreas[polygonIndex]!; polygonIndex += 1; }
      const polygon = polygons[polygonIndex]!;
      const [minLng, minLat, maxLng, maxLat] = ringBounds(polygon[0]!);
      let lat: number | null = null;
      let lng: number | null = null;
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const candidateLng = minLng + random() * (maxLng - minLng);
        const candidateLat = minLat + random() * (maxLat - minLat);
        if (insidePolygon(polygon, candidateLng, candidateLat)) { lng = candidateLng; lat = candidateLat; break; }
      }
      if (lng === null || lat === null) continue;
      hotspots.push({
        id: `hotspot-${feature.slug}-${index}`,
        provinceSlug: feature.slug,
        province: feature.name,
        name: `Hotspot ${feature.name} ${String(hotspots.filter((point) => point.provinceSlug === feature.slug).length + 1).padStart(3, "0")}`,
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        confidence: Math.min(100, Math.max(2, Math.round(100 * random() ** risk)))
      });
    }
  });
  return hotspots;
}

export type ConfidenceBand = { name: string; range: string; color: string; ink: string; tone: "low" | "mid" | "high" };

/** Green = low trust, yellow = medium, red = danger. Ink keeps numbers readable. */
export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence < 30) return { name: "Kepercayaan rendah", range: "0–29%", color: "#22A55B", ink: "#FFFFFF", tone: "low" };
  if (confidence < 80) return { name: "Kepercayaan sedang", range: "30–79%", color: "#E8B931", ink: "#111827", tone: "mid" };
  return { name: "Kepercayaan tinggi / bahaya", range: "80–100%", color: "#DC2626", ink: "#FFFFFF", tone: "high" };
}

export const CONFIDENCE_BANDS: readonly ConfidenceBand[] = [confidenceBand(0), confidenceBand(30), confidenceBand(80)];

export function sortHotspots(points: Hotspot[], sort: ConfidenceSort): Hotspot[] {
  const sorted = [...points];
  if (sort === "CONF_ASC") return sorted.sort((left, right) => left.confidence - right.confidence || left.name.localeCompare(right.name, "id"));
  if (sort === "CONF_DESC") return sorted.sort((left, right) => right.confidence - left.confidence || left.name.localeCompare(right.name, "id"));
  return sorted.sort((left, right) => left.name.localeCompare(right.name, "id"));
}
