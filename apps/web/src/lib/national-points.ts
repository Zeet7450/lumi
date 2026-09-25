/**
 * Dummy nationwide ISPU monitoring points. There is no real sensor network of
 * this size, so every point is generated deterministically inside the real
 * province polygon it claims to sit in — the map geometry stays honest even
 * though the readings are synthetic.
 */
/** Identity is the slug: the source file repeats KODE_PROV across the four new Papua provinces. */
export type ProvinceFeature = {
  name: string;
  slug: string;
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
};

export type NationalPoint = {
  id: string;
  provinceSlug: string;
  province: string;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
};

type Position = [number, number];
type Ring = Position[];

const GEOJSON_URL = "/geo/indonesia-provinces.geojson";
const DEFAULT_POINTS = 2_000;
export const POINT_DENSITIES = [1_000, 2_000, 5_000, 10_000] as const;

/** Seeded PRNG so the same density always paints the same map. */
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

export function provinceSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function loadProvinceBoundaries(): Promise<ProvinceFeature[]> {
  const response = await fetch(GEOJSON_URL, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Batas provinsi: ${response.status}`);
  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null || !Array.isArray((data as { features?: unknown }).features)) throw new Error("Batas provinsi: format tidak dikenali");
  return (data as { features: Array<{ properties?: Record<string, unknown>; geometry?: ProvinceFeature["geometry"] }> }).features
    .filter((feature) => typeof feature.properties?.PROVINSI === "string" && feature.geometry && (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon"))
    .map((feature) => {
      const name = String(feature.properties!.PROVINSI);
      return { name, slug: provinceSlug(name), geometry: feature.geometry! };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "id"));
}

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

/** Outer ring contained and no hole contains it — the standard even-odd test. */
function insidePolygon(polygon: Ring[], lng: number, lat: number): boolean {
  if (!polygon.length || !insideRing(polygon[0]!, lng, lat)) return false;
  return !polygon.slice(1).some((hole) => insideRing(hole, lng, lat));
}

type IslandRisk = "HIGH" | "MEDIUM" | "LOW";

/** Haze-prone provinces read worse, eastern Indonesia calmer — a demo mirror of the real pattern. */
function islandRisk(province: string): IslandRisk {
  if (/^(Maluku|Papua|Nusa Tenggara)/.test(province)) return "LOW";
  if (/^(Kalimantan|Sumatera|Riau|Jambi|Kepulauan Riau|Kepulauan Bangka Belitung|Aceh|Bengkulu|Lampung)/.test(province)) return "HIGH";
  return "MEDIUM";
}

function aqiFor(random: () => number, risk: IslandRisk): number {
  const [floor, spread, skew] = risk === "HIGH" ? [45, 385, 1.5] : risk === "MEDIUM" ? [25, 265, 1.7] : [12, 175, 1.9];
  return Math.max(4, Math.min(468, Math.round(floor + spread * random() ** skew)));
}

/**
 * Distributes the requested number of synthetic stations across all provinces,
 * weighted by polygon area, then places each one inside its own province.
 */
export function generateNationalPoints(features: ProvinceFeature[], total = DEFAULT_POINTS): NationalPoint[] {
  if (!features.length) return [];
  const areas = features.map((feature) => polygonsOf(feature).reduce((sum, polygon) => {
    const [minLng, minLat, maxLng, maxLat] = ringBounds(polygon[0]!);
    return sum + Math.max(0.0004, (maxLng - minLng) * (maxLat - minLat));
  }, 0));
  const totalArea = areas.reduce((sum, value) => sum + value, 0);
  const points: NationalPoint[] = [];
  features.forEach((feature, featureIndex) => {
    const share = Math.max(4, Math.round((areas[featureIndex]! / totalArea) * total));
    const polygons = polygonsOf(feature);
    const polygonAreas = polygons.map((polygon) => {
      const [minLng, minLat, maxLng, maxLat] = ringBounds(polygon[0]!);
      return Math.max(0.0004, (maxLng - minLng) * (maxLat - minLat));
    });
    const polygonTotal = polygonAreas.reduce((sum, value) => sum + value, 0);
    const random = mulberry32(seedFrom(`${feature.slug}:${total}`));
    const risk = islandRisk(feature.name);
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
      const ordinal = points.filter((point) => point.provinceSlug === feature.slug).length + 1;
      points.push({
        id: `${feature.slug}-${index}`,
        provinceSlug: feature.slug,
        province: feature.name,
        name: `Stasiun ${feature.name} ${String(ordinal).padStart(3, "0")}`,
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        aqi: aqiFor(random, risk)
      });
    }
  });
  return points;
}

export type NationalSort = "NAME_ASC" | "AQI_ASC" | "AQI_DESC";

export function sortNationalPoints(points: NationalPoint[], sort: NationalSort): NationalPoint[] {
  const sorted = [...points];
  if (sort === "AQI_ASC") return sorted.sort((left, right) => left.aqi - right.aqi || left.name.localeCompare(right.name, "id"));
  if (sort === "AQI_DESC") return sorted.sort((left, right) => right.aqi - left.aqi || left.name.localeCompare(right.name, "id"));
  return sorted.sort((left, right) => left.name.localeCompare(right.name, "id"));
}
