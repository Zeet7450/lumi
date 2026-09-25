/**
 * Official Indonesian ISPU (Indeks Standar Pencemar Udara) colour scale, the
 * five-band standard published by KLHK (ispu.kemenlh.go.id) — deliberately not
 * the six-band IQAir/US-EPA scale this app used before.
 */
export type IspuBand = { limit: number; name: string; range: string; color: string; ink: string };

export const ISPU_BANDS: readonly IspuBand[] = [
  { limit: 50, name: "Baik", range: "0–50", color: "#00A65A", ink: "#FFFFFF" },
  { limit: 100, name: "Sedang", range: "51–100", color: "#2D9CDB", ink: "#FFFFFF" },
  { limit: 200, name: "Tidak Sehat", range: "101–200", color: "#F2C200", ink: "#3D2F00" },
  { limit: 300, name: "Sangat Tidak Sehat", range: "201–300", color: "#E53935", ink: "#FFFFFF" },
  { limit: Number.POSITIVE_INFINITY, name: "Berbahaya", range: "301–500", color: "#1C1C1C", ink: "#FFFFFF" }
] as const;

export function ispuBand(aqi: number | null): IspuBand | null {
  if (aqi === null || !Number.isFinite(aqi) || aqi < 0) return null;
  return ISPU_BANDS.find((band) => aqi <= band.limit) ?? ISPU_BANDS[ISPU_BANDS.length - 1]!;
}

export function ispuColor(aqi: number | null): string {
  return ispuBand(aqi)?.color ?? "#8793A4";
}

export function ispuLabel(aqi: number | null): string {
  const band = ispuBand(aqi);
  return band ? `${band.name} ${band.range}` : "Belum ada data";
}
