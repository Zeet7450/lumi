const publicSourceLabels = new Map<string, string>([
  ["LUMI curated demo fixture", "Data demo LUMI"],
  ["OpenAQ", "OpenAQ"],
  ["Open-Meteo", "Open-Meteo"],
  ["BMKG", "BMKG"],
  ["NASA FIRMS", "NASA FIRMS"]
]);

/** Never expose an adapter's raw source string to unauthenticated clients. */
export function publicSourceLabel(source: string): string {
  return publicSourceLabels.get(source) ?? "Sumber data terverifikasi LUMI";
}
