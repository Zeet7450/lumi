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
  ,{ id: "pontianak-timur", province: "Kalimantan Barat", kabupaten: "Kota Pontianak", kecamatan: "Pontianak Timur", kelurahan: "Saigon", name: "Pantau Saigon", coordinates: [-0.035,109.370], aqi: 83, pm25: 28, trend: "Stabil", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "pontianak-barat", province: "Kalimantan Barat", kabupaten: "Kota Pontianak", kecamatan: "Pontianak Barat", kelurahan: "Pal Lima", name: "Pantau Pal Lima", coordinates: [-0.042,109.310], aqi: 77, pm25: 24, trend: "Menurun", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "pontianak-kota", province: "Kalimantan Barat", kabupaten: "Kota Pontianak", kecamatan: "Pontianak Kota", kelurahan: "Darat Sekip", name: "Pantau Darat Sekip", coordinates: [-0.045,109.333], aqi: 81, pm25: 26, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "kubu", province: "Kalimantan Barat", kabupaten: "Kubu Raya", kecamatan: "Kubu", kelurahan: "Kubu", name: "Pos Kubu", coordinates: [-0.320,109.320], aqi: 87, pm25: 30, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "rasau-jaya", province: "Kalimantan Barat", kabupaten: "Kubu Raya", kecamatan: "Rasau Jaya", kelurahan: "Rasau Jaya Umum", name: "Pantau Rasau Jaya", coordinates: [-0.190,109.430], aqi: 86, pm25: 29, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "teluk-pak-kedai", province: "Kalimantan Barat", kabupaten: "Kubu Raya", kecamatan: "Teluk Pak Kedai", kelurahan: "Teluk Pak Kedai", name: "Pos Teluk Pak Kedai", coordinates: [-0.420,109.170], aqi: 79, pm25: 25, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "toho", province: "Kalimantan Barat", kabupaten: "Mempawah", kecamatan: "Toho", kelurahan: "Toho Ilir", name: "Pantau Toho", coordinates: [0.430,109.200], aqi: 69, pm25: 21, trend: "Menurun", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "siantan", province: "Kalimantan Barat", kabupaten: "Mempawah", kecamatan: "Siantan", kelurahan: "Wajok Hulu", name: "Pos Wajok Hulu", coordinates: [0.170,109.090], aqi: 73, pm25: 23, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "sejangkung", province: "Kalimantan Barat", kabupaten: "Sambas", kecamatan: "Sejangkung", kelurahan: "Sejangkung", name: "Pantau Sejangkung", coordinates: [1.390,109.090], aqi: 92, pm25: 34, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "pemangkat", province: "Kalimantan Barat", kabupaten: "Sambas", kecamatan: "Pemangkat", kelurahan: "Pemangkat Kota", name: "Pos Pemangkat", coordinates: [1.170,108.970], aqi: 88, pm25: 31, trend: "Stabil", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "selakau", province: "Kalimantan Barat", kabupaten: "Sambas", kecamatan: "Selakau", kelurahan: "Selakau Tua", name: "Pantau Selakau", coordinates: [0.970,108.910], aqi: 90, pm25: 33, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "samalantan", province: "Kalimantan Barat", kabupaten: "Bengkayang", kecamatan: "Samalantan", kelurahan: "Samalantan", name: "Pos Samalantan", coordinates: [1.030,109.280], aqi: 71, pm25: 21, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "sungai-raya-kepulauan", province: "Kalimantan Barat", kabupaten: "Bengkayang", kecamatan: "Sungai Raya Kepulauan", kelurahan: "Sungai Raya", name: "Pantau Sungai Raya Kepulauan", coordinates: [0.870,108.860], aqi: 75, pm25: 24, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "tayan-hilir", province: "Kalimantan Barat", kabupaten: "Sanggau", kecamatan: "Tayan Hilir", kelurahan: "Kawat", name: "Pos Tayan Hilir", coordinates: [0.000,110.120], aqi: 80, pm25: 27, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "entikong", province: "Kalimantan Barat", kabupaten: "Sanggau", kecamatan: "Entikong", kelurahan: "Entikong", name: "Pantau Entikong", coordinates: [0.970,110.180], aqi: 68, pm25: 20, trend: "Menurun", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "balai", province: "Kalimantan Barat", kabupaten: "Sanggau", kecamatan: "Balai", kelurahan: "Sebunga", name: "Pos Balai", coordinates: [-0.300,110.050], aqi: 74, pm25: 22, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "belitang", province: "Kalimantan Barat", kabupaten: "Sekadau", kecamatan: "Belitang", kelurahan: "Belitang", name: "Pantau Belitang", coordinates: [0.370,111.150], aqi: 79, pm25: 26, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "nanga-taman", province: "Kalimantan Barat", kabupaten: "Sekadau", kecamatan: "Nanga Taman", kelurahan: "Nanga Taman", name: "Pos Nanga Taman", coordinates: [0.080,111.120], aqi: 76, pm25: 24, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "ketungau-hilir", province: "Kalimantan Barat", kabupaten: "Sintang", kecamatan: "Ketungau Hilir", kelurahan: "Senaning", name: "Pantau Ketungau Hilir", coordinates: [0.600,112.100], aqi: 67, pm25: 19, trend: "Menurun", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "tempunak", province: "Kalimantan Barat", kabupaten: "Sintang", kecamatan: "Tempunak", kelurahan: "Tempunak", name: "Pos Tempunak", coordinates: [0.010,111.700], aqi: 73, pm25: 22, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "serawai", province: "Kalimantan Barat", kabupaten: "Sintang", kecamatan: "Serawai", kelurahan: "Nanga Serawai", name: "Pantau Serawai", coordinates: [-0.430,111.950], aqi: 84, pm25: 29, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "sayan", province: "Kalimantan Barat", kabupaten: "Melawi", kecamatan: "Sayan", kelurahan: "Sayan", name: "Pos Sayan", coordinates: [-0.550,112.200], aqi: 81, pm25: 27, trend: "Stabil", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "ella-hilir", province: "Kalimantan Barat", kabupaten: "Melawi", kecamatan: "Ella Hilir", kelurahan: "Nanga Ella", name: "Pantau Ella Hilir", coordinates: [-0.480,111.500], aqi: 78, pm25: 25, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "silat-hilir", province: "Kalimantan Barat", kabupaten: "Kapuas Hulu", kecamatan: "Silat Hilir", kelurahan: "Silat Hilir", name: "Pos Silat Hilir", coordinates: [0.510,112.510], aqi: 66, pm25: 18, trend: "Menurun", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "badau", province: "Kalimantan Barat", kabupaten: "Kapuas Hulu", kecamatan: "Badau", kelurahan: "Badau", name: "Pantau Badau", coordinates: [1.000,112.580], aqi: 64, pm25: 17, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "mentebah", province: "Kalimantan Barat", kabupaten: "Kapuas Hulu", kecamatan: "Mentebah", kelurahan: "Mentebah", name: "Pos Mentebah", coordinates: [0.350,112.050], aqi: 70, pm25: 20, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "sandai", province: "Kalimantan Barat", kabupaten: "Ketapang", kecamatan: "Sandai", kelurahan: "Sandai", name: "Pantau Sandai", coordinates: [-1.200,110.300], aqi: 83, pm25: 28, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "simpang-hulu", province: "Kalimantan Barat", kabupaten: "Ketapang", kecamatan: "Simpang Hulu", kelurahan: "Balai Berkuak", name: "Pos Simpang Hulu", coordinates: [-1.100,111.000], aqi: 80, pm25: 26, trend: "Stabil", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "jelai-hulu", province: "Kalimantan Barat", kabupaten: "Ketapang", kecamatan: "Jelai Hulu", kelurahan: "Riam Danau", name: "Pantau Jelai Hulu", coordinates: [-1.700,111.400], aqi: 76, pm25: 24, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "pulau-maya", province: "Kalimantan Barat", kabupaten: "Kayong Utara", kecamatan: "Pulau Maya", kelurahan: "Dusun Besar", name: "Pos Pulau Maya", coordinates: [-1.330,110.080], aqi: 78, pm25: 25, trend: "Meningkat", environmentalStatus: "Pantau", incidentStatus: "Tidak ada" }
  ,{ id: "seponti", province: "Kalimantan Barat", kabupaten: "Kayong Utara", kecamatan: "Seponti", kelurahan: "Telaga Arum", name: "Pantau Seponti", coordinates: [-1.070,110.670], aqi: 75, pm25: 23, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "mandor", province: "Kalimantan Barat", kabupaten: "Landak", kecamatan: "Mandor", kelurahan: "Mandor", name: "Pos Mandor", coordinates: [0.400,109.600], aqi: 72, pm25: 21, trend: "Menurun", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
  ,{ id: "menjalin", province: "Kalimantan Barat", kabupaten: "Landak", kecamatan: "Menjalin", kelurahan: "Menjalin", name: "Pantau Menjalin", coordinates: [0.700,109.450], aqi: 70, pm25: 20, trend: "Stabil", environmentalStatus: "Tervalidasi", incidentStatus: "Tidak ada" }
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
  const observation = scenario.observation;
  const sources = scenario.simulation.sources ?? [];
  return demoReferencePoints.map((point) => {
    const impacts = sources.map((source) => {
      const sourcePoint = demoReferencePoint(source.sourcePointId);
      const km = distanceKm(sourcePoint.coordinates, point.coordinates);
      const radiusKm = source.radiusMeters / 1_000;
      const difference = Math.abs(((bearing(sourcePoint.coordinates, point.coordinates) - windBearing[source.windDirection] + 540) % 360) - 180);
      const inRadius = point.id === source.sourcePointId || (km <= radiusKm && difference <= 62);
      return inRadius ? Math.max(.25, 1 - km / Math.max(1, radiusKm)) * (1 + source.intensity / 8) : 0;
    });
    const impactStrength = impacts.reduce((total, value) => total + value, 0);
    const affected = scenario.workflow !== "READY" && impactStrength > 0;
    const sourcePoint = sources.some((source) => point.id === source.sourcePointId);
    const impact = sourcePoint ? "Sumber simulasi" : affected ? "Dampak asap" : "Tidak terdampak";
    const aqi = affected && observation ? Math.min(500, Math.round(Math.max(point.aqi, observation.aqi * Math.min(1.55, impactStrength)))) : point.aqi;
    const pm25 = affected && observation ? Math.min(500, Math.round(Math.max(point.pm25, observation.pm25 * Math.min(1.55, impactStrength)))) : point.pm25;
    return { ...point, aqi, pm25, affected, impact, wind: affected ? observation?.wind ?? null : null, radiusKm: Math.max(...sources.map((source) => source.radiusMeters / 1_000)), incidentStatus: sourcePoint ? "Kebakaran sintetis" : affected ? "Asap sintetis" : point.incidentStatus, authorizedAction: !affected ? "Pantau kondisi sintetis" : scenario.workflow === "ENVIRONMENT_PENDING" ? "DLH memvalidasi dampak lingkungan" : scenario.workflow === "ENVIRONMENT_VALIDATED" ? "BPBD memverifikasi insiden" : scenario.workflow === "INCIDENT_VERIFIED" ? "BPBD mencatat respons" : "Tidak ada tindakan tambahan untuk titik ini" };
  });
}
