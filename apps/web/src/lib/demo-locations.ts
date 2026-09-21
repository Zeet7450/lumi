import type { DemoScenario } from "./demo-scenario";

export type EnvironmentalStatus = "Tervalidasi" | "Perlu verifikasi" | "Pantau";
export type IncidentStatus = "Tidak ada" | "Asap sintetis" | "Kebakaran sintetis";

export type DemoReferencePoint = {
  id: string;
  province: "Kalimantan Barat";
  kabupaten: string;
  kecamatan: string;
  kelurahan: string;
  name: string;
  coordinates: [number, number];
  aqi: number;
  pm25: number;
  trend: "Menurun" | "Stabil" | "Meningkat";
  environmentalStatus: EnvironmentalStatus;
  incidentStatus: IncidentStatus;
};

export const demoReferencePoints: readonly DemoReferencePoint[] = [
  { id: "pontianak-utara", province: "Kalimantan Barat", kabupaten: "Kota Pontianak", kecamatan: "Pontianak Utara", kelurahan: "Siantan Hulu", name: "Stasiun Siantan", coordinates: [-0.025, 109.336], aqi: 84, pm25: 29, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" },
  { id: "pontianak-selatan", province: "Kalimantan Barat", kabupaten: "Kota Pontianak", kecamatan: "Pontianak Selatan", kelurahan: "Akcaya", name: "Pantau Akcaya", coordinates: [-0.057, 109.338], aqi: 78, pm25: 25, trend: "Menurun", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" },
  { id: "sungai-raya", province: "Kalimantan Barat", kabupaten: "Kubu Raya", kecamatan: "Sungai Raya", kelurahan: "Sungai Raya Dalam", name: "Pos Sungai Raya", coordinates: [-0.072, 109.403], aqi: 88, pm25: 31, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" },
  { id: "mempawah", province: "Kalimantan Barat", kabupaten: "Mempawah", kecamatan: "Mempawah Hilir", kelurahan: "Tengah", name: "Pantau Mempawah", coordinates: [0.365, 109.000], aqi: 72, pm25: 22, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" },
  { id: "singkawang", province: "Kalimantan Barat", kabupaten: "Kota Singkawang", kecamatan: "Singkawang Barat", kelurahan: "Melayu", name: "Stasiun Singkawang", coordinates: [0.907, 108.984], aqi: 96, pm25: 35, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" },
  { id: "bengkayang", province: "Kalimantan Barat", kabupaten: "Bengkayang", kecamatan: "Bengkayang", kelurahan: "Sebalo", name: "Pantau Bengkayang", coordinates: [0.822, 109.476], aqi: 68, pm25: 20, trend: "Menurun", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" },
  { id: "sambas", province: "Kalimantan Barat", kabupaten: "Sambas", kecamatan: "Sambas", kelurahan: "Dalam Kaum", name: "Stasiun Sambas", coordinates: [1.359, 109.310], aqi: 91, pm25: 33, trend: "Stabil", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" },
  { id: "sanggau", province: "Kalimantan Barat", kabupaten: "Sanggau", kecamatan: "Kapuas", kelurahan: "Beringin", name: "Pantau Sanggau", coordinates: [0.119, 110.598], aqi: 76, pm25: 24, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" },
  { id: "sekadau", province: "Kalimantan Barat", kabupaten: "Sekadau", kecamatan: "Sekadau Hilir", kelurahan: "Sungai Ringin", name: "Pos Sekadau", coordinates: [0.016, 110.901], aqi: 82, pm25: 28, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" },
  { id: "sintang", province: "Kalimantan Barat", kabupaten: "Sintang", kecamatan: "Sintang", kelurahan: "Kapuas Kanan Hulu", name: "Stasiun Sintang", coordinates: [0.080, 111.497], aqi: 70, pm25: 21, trend: "Menurun", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" },
  { id: "melawi", province: "Kalimantan Barat", kabupaten: "Melawi", kecamatan: "Nanga Pinoh", kelurahan: "Tanjung Niaga", name: "Pantau Nanga Pinoh", coordinates: [-0.349, 111.748], aqi: 89, pm25: 32, trend: "Meningkat", environmentalStatus: "Perlu verifikasi", incidentStatus: "Tidak ada" },
  { id: "kapuas-hulu", province: "Kalimantan Barat", kabupaten: "Kapuas Hulu", kecamatan: "Putussibau Utara", kelurahan: "Hilir Kantor", name: "Pos Putussibau", coordinates: [0.835, 112.934], aqi: 65, pm25: 18, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" },
  { id: "ketapang", province: "Kalimantan Barat", kabupaten: "Ketapang", kecamatan: "Delta Pawan", kelurahan: "Sampit", name: "Stasiun Ketapang", coordinates: [-1.854, 109.970], aqi: 75, pm25: 23, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" },
  { id: "kayong-utara", province: "Kalimantan Barat", kabupaten: "Kayong Utara", kecamatan: "Sukadana", kelurahan: "Pampang Harapan", name: "Pantau Sukadana", coordinates: [-1.110, 110.041], aqi: 80, pm25: 27, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" },
  { id: "landak", province: "Kalimantan Barat", kabupaten: "Landak", kecamatan: "Ngabang", kelurahan: "Raja", name: "Pos Ngabang", coordinates: [0.348, 109.300], aqi: 74, pm25: 22, trend: "Menurun", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
];

export function demoReferencePoint(id: string): DemoReferencePoint {
  return demoReferencePoints.find((point) => point.id === id) ?? demoReferencePoints[0]!;
}

export function isDemoReferencePointId(id: string): boolean {
  return demoReferencePoints.some((point) => point.id === id);
}

function distanceKm(from: [number, number], to: [number, number]): number {
  const radians = Math.PI / 180;
  const [fromLat, fromLng] = from.map((value) => value * radians) as [number, number];
  const [toLat, toLng] = to.map((value) => value * radians) as [number, number];
  const dLat = toLat - fromLat;
  const dLng = toLng - fromLng;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(from: [number, number], to: [number, number]): number {
  const radians = Math.PI / 180;
  const [fromLat, fromLng] = from.map((value) => value * radians) as [number, number];
  const [toLat, toLng] = to.map((value) => value * radians) as [number, number];
  const y = Math.sin(toLng - fromLng) * Math.cos(toLat);
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(toLng - fromLng);
  return (Math.atan2(y, x) / radians + 360) % 360;
}

const windBearing = { Tenggara: 135, Selatan: 180, "Barat Daya": 225, Barat: 270 } as const;

export type OperationalPoint = DemoReferencePoint & { affected: boolean; impact: "Tidak terdampak" | "Dampak asap" | "Sumber simulasi"; wind: string | null; radiusKm: number; authorizedAction: string };

export function projectOperationalPoints(scenario: DemoScenario): OperationalPoint[] {
  const source = demoReferencePoint(scenario.simulation.sourcePointId);
  const observation = scenario.observation;
  return demoReferencePoints.map((point) => {
    const km = distanceKm(source.coordinates, point.coordinates);
    const difference = Math.abs(((bearing(source.coordinates, point.coordinates) - windBearing[scenario.simulation.windDirection] + 540) % 360) - 180);
    const affected = scenario.workflow !== "READY" && (point.id === source.id || (km <= scenario.simulation.impactRadiusKm && difference <= 62));
    const sourcePoint = point.id === source.id;
    const impact = sourcePoint ? "Sumber simulasi" : affected ? "Dampak asap" : "Tidak terdampak";
    const falloff = Math.max(.35, 1 - km / Math.max(1, scenario.simulation.impactRadiusKm));
    const aqi = affected && observation ? Math.round(Math.max(point.aqi, observation.aqi * falloff)) : point.aqi;
    const pm25 = affected && observation ? Math.round(Math.max(point.pm25, observation.pm25 * falloff)) : point.pm25;
    return { ...point, aqi, pm25, affected, impact, wind: affected ? observation?.wind ?? null : null, radiusKm: scenario.simulation.impactRadiusKm, incidentStatus: sourcePoint ? (scenario.simulation.fireHazeStatus === "FIRE" ? "Kebakaran sintetis" : "Asap sintetis") : affected ? "Asap sintetis" : point.incidentStatus, authorizedAction: !affected ? "Pantau kondisi sintetis" : scenario.workflow === "ENVIRONMENT_PENDING" ? "DLH memvalidasi dampak lingkungan" : scenario.workflow === "ENVIRONMENT_VALIDATED" ? "BPBD memverifikasi insiden" : scenario.workflow === "INCIDENT_VERIFIED" ? "BPBD mencatat respons" : "Tidak ada tindakan tambahan untuk titik ini" };
  });
}
