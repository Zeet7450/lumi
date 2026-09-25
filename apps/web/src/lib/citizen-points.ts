/**
 * Live monitoring points for the citizen landing page.
 *
 * Points come from the Supabase `regions` table (the same catalogue the ops
 * backend seeds), read through the local REST endpoint with the publishable
 * key only — no service secret reaches the browser bundle. The catalogue is
 * currently Kalimantan-wide, but nothing here is Kalimantan-specific: the
 * national bounds and the generic status colour scale are the only coupling,
 * and both are one-line swaps when coverage grows beyond Kalimantan.
 */

export type CitizenPoint = {
  id: string;
  name: string;
  province: string;
  provinceSlug: string;
  lat: number;
  lng: number;
};

export type PointStatus = "idle" | "watch" | "alert";

/**
 * Status colour scale is deliberately one small map. The product owner has not
 * finalised the citizen-facing status scheme, so swapping this table (or the
 * function) is the whole migration — no component hardcodes a status colour.
 */
const STATUS_COLORS: Record<PointStatus, string> = {
  idle: "#1E3A5F",
  watch: "#F59E0B",
  alert: "#DC2626"
};

export function pointStatusColor(status: PointStatus): string {
  return STATUS_COLORS[status];
}

/** Indonesia bounding box — the designed frame for national coverage. */
export const INDONESIA_BOUNDS: [[number, number], [number, number]] = [[-11.2, 94.4], [6.4, 141.3]];

type RegionRow = {
  slug: string;
  province_slug: string;
  province_name: string;
  display_name: string;
  latitude: number;
  longitude: number;
};

type BridgePoint = {
  id: string;
  province: string;
  provinceSlug: string;
  name: string;
  coordinates: [number, number];
};

function isRegionRow(value: unknown): value is RegionRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.slug === "string" && typeof row.province_slug === "string" && typeof row.province_name === "string" && typeof row.display_name === "string" && typeof row.latitude === "number" && typeof row.longitude === "number";
}

function fromRegionRow(row: RegionRow): CitizenPoint {
  return { id: row.slug, name: row.display_name, province: row.province_name, provinceSlug: row.province_slug, lat: row.latitude, lng: row.longitude };
}

function fromBridgePoint(value: BridgePoint): CitizenPoint {
  const [lat, lng] = value.coordinates;
  return { id: value.id, name: value.name, province: value.province, provinceSlug: "kalbar", lat, lng };
}

const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const BRIDGE_ORIGIN = process.env.NEXT_PUBLIC_LUMI_STATE_ORIGIN ?? "http://127.0.0.1:3100";

type LoadResult = { points: CitizenPoint[]; source: "supabase" | "bridge" };

async function fromSupabase(): Promise<CitizenPoint[]> {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const response = await fetch(`${SUPABASE_ORIGIN}/rest/v1/regions?select=slug,province_slug,province_name,display_name,latitude,longitude&order=slug.asc`, {
    headers: { apikey: key },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Supabase regions: ${response.status}`);
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error("Supabase regions: unexpected payload");
  return rows.filter(isRegionRow).map(fromRegionRow);
}

async function fromBridge(): Promise<CitizenPoint[]> {
  const response = await fetch(`${BRIDGE_ORIGIN}/state`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Bridge state: ${response.status}`);
  const data: unknown = await response.json();
  const reference = typeof data === "object" && data !== null && "referencePoints" in data ? (data as { referencePoints?: unknown }).referencePoints : null;
  if (!Array.isArray(reference)) return [];
  return reference.filter((item): item is BridgePoint => typeof item === "object" && item !== null && "id" in item && "coordinates" in item).map(fromBridgePoint);
}

/**
 * Server-side loader for the landing page. Tries Supabase first (the real data
 * source), then the local demo bridge, then ships an empty list — the hero
 * renders an honest "no points yet" state instead of fake data.
 */
export async function loadCitizenPoints(): Promise<LoadResult> {
  try {
    const points = await fromSupabase();
    if (points.length) return { points, source: "supabase" };
  } catch { /* fall through to the local bridge. */ }
  try {
    const points = await fromBridge();
    if (points.length) return { points, source: "bridge" };
  } catch { /* fall through to the empty state. */ }
  return { points: [], source: "bridge" };
}
