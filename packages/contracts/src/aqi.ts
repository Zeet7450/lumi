export type AqiBand = "GOOD" | "MODERATE" | "UNHEALTHY_SENSITIVE" | "UNHEALTHY" | "VERY_UNHEALTHY" | "HAZARDOUS";

const breakpoints: ReadonlyArray<{ concentration: readonly [number, number]; aqi: readonly [number, number]; band: AqiBand }> = [
  { concentration: [0, 12], aqi: [0, 50], band: "GOOD" },
  { concentration: [12.1, 35.4], aqi: [51, 100], band: "MODERATE" },
  { concentration: [35.5, 55.4], aqi: [101, 150], band: "UNHEALTHY_SENSITIVE" },
  { concentration: [55.5, 125.4], aqi: [151, 200], band: "UNHEALTHY" },
  { concentration: [125.5, 225.4], aqi: [201, 300], band: "VERY_UNHEALTHY" },
  { concentration: [225.5, 500.4], aqi: [301, 500], band: "HAZARDOUS" }
];

/** US EPA PM2.5 AQI conversion, appropriate for transparent demo visualization. */
export function aqiFromPm25(value: number): { aqi: number; band: AqiBand } {
  const concentration = Math.max(0, Math.min(500.4, Math.floor(value * 10) / 10));
  const point = breakpoints.find((item) => concentration >= item.concentration[0] && concentration <= item.concentration[1]) ?? breakpoints.at(-1)!;
  const [clow, chigh] = point.concentration;
  const [ilow, ihigh] = point.aqi;
  return { aqi: Math.round(((ihigh - ilow) / (chigh - clow)) * (concentration - clow) + ilow), band: point.band };
}

/** Inverse of the published AQI interpolation for simulator input only. */
export function pm25FromAqi(value: number): number {
  const aqi = Math.max(0, Math.min(500, Math.round(value)));
  const point = breakpoints.find((item) => aqi >= item.aqi[0] && aqi <= item.aqi[1]) ?? breakpoints.at(-1)!;
  const [clow, chigh] = point.concentration;
  const [ilow, ihigh] = point.aqi;
  return Math.round((clow + ((aqi - ilow) / (ihigh - ilow)) * (chigh - clow)) * 10) / 10;
}
