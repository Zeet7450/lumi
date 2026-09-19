/** Curated operational catalogue for the first LUMI rollout. Reference points select and locate telemetry; they do not claim a sensor placement. */
export interface DemoAdministrativeBoundary {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
  source: "Geoapify administrative boundary";
}

export interface DemoLocation {
  id: string;
  regionSlug: string;
  provinceSlug: "kalbar" | "kalteng" | "kalsel" | "kaltim" | "kaltara";
  province: string;
  name: string;
  city: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
}

type Province = Pick<DemoLocation, "provinceSlug" | "province">;
const provinces: Record<DemoLocation["provinceSlug"], Province> = {
  kalbar: { provinceSlug: "kalbar", province: "Kalimantan Barat" }, kalteng: { provinceSlug: "kalteng", province: "Kalimantan Tengah" },
  kalsel: { provinceSlug: "kalsel", province: "Kalimantan Selatan" }, kaltim: { provinceSlug: "kaltim", province: "Kalimantan Timur" },
  kaltara: { provinceSlug: "kaltara", province: "Kalimantan Utara" }
};
function place(id: string, provinceSlug: DemoLocation["provinceSlug"], city: string, latitude: number, longitude: number, legacyRegionSlug?: string): DemoLocation {
  return { id, regionSlug: legacyRegionSlug ?? id, ...provinces[provinceSlug], name: city.replace(/^Kabupaten |^Kota /, ""), city, district: city, village: "Pusat wilayah", latitude, longitude };
}

/** All 56 kabupaten/kota of Kalimantan. */
export const demoLocations: readonly DemoLocation[] = [
  place("sambas", "kalbar", "Kabupaten Sambas", 1.36, 109.31), place("bengkayang", "kalbar", "Kabupaten Bengkayang", 0.82, 109.48), place("landak", "kalbar", "Kabupaten Landak", 0.34, 109.32), place("mempawah", "kalbar", "Kabupaten Mempawah", 0.37, 108.95),
  place("sanggau", "kalbar", "Kabupaten Sanggau", 0.12, 110.60), place("ketapang", "kalbar", "Kabupaten Ketapang", -1.82, 109.97), place("sintang", "kalbar", "Kabupaten Sintang", 0.08, 111.50), place("kapuas-hulu", "kalbar", "Kabupaten Kapuas Hulu", 0.83, 112.93),
  place("sekadau", "kalbar", "Kabupaten Sekadau", 0.02, 110.90), place("melawi", "kalbar", "Kabupaten Melawi", -0.35, 111.73), place("kubu-raya", "kalbar", "Kabupaten Kubu Raya", -0.25, 109.48), place("kayong-utara", "kalbar", "Kabupaten Kayong Utara", -1.28, 110.06),
  place("kota-pontianak", "kalbar", "Kota Pontianak", -0.03, 109.34, "pontianak"), place("kota-singkawang", "kalbar", "Kota Singkawang", 0.91, 108.98),
  place("kotawaringin-barat", "kalteng", "Kabupaten Kotawaringin Barat", -2.68, 111.62), place("kotawaringin-timur", "kalteng", "Kabupaten Kotawaringin Timur", -2.53, 112.95), place("kapuas", "kalteng", "Kabupaten Kapuas", -3.01, 114.39), place("barito-selatan", "kalteng", "Kabupaten Barito Selatan", -1.95, 114.77),
  place("barito-utara", "kalteng", "Kabupaten Barito Utara", -0.95, 114.90), place("sukamara", "kalteng", "Kabupaten Sukamara", -2.63, 111.24), place("lamandau", "kalteng", "Kabupaten Lamandau", -1.88, 111.28), place("seruyan", "kalteng", "Kabupaten Seruyan", -3.39, 112.54),
  place("katingan", "kalteng", "Kabupaten Katingan", -1.90, 113.39), place("pulang-pisau", "kalteng", "Kabupaten Pulang Pisau", -3.00, 114.00), place("gunung-mas", "kalteng", "Kabupaten Gunung Mas", -1.01, 113.87), place("barito-timur", "kalteng", "Kabupaten Barito Timur", -2.10, 115.18),
  place("murung-raya", "kalteng", "Kabupaten Murung Raya", -0.62, 114.57), place("kota-palangkaraya", "kalteng", "Kota Palangka Raya", -2.21, 113.92, "kalteng"),
  place("tanah-laut", "kalsel", "Kabupaten Tanah Laut", -3.80, 114.80), place("kotabaru", "kalsel", "Kabupaten Kotabaru", -3.30, 116.16), place("banjar", "kalsel", "Kabupaten Banjar", -3.42, 114.85), place("barito-kuala", "kalsel", "Kabupaten Barito Kuala", -3.03, 114.67),
  place("tapin", "kalsel", "Kabupaten Tapin", -2.92, 115.05), place("hulu-sungai-selatan", "kalsel", "Kabupaten Hulu Sungai Selatan", -2.78, 115.26), place("hulu-sungai-tengah", "kalsel", "Kabupaten Hulu Sungai Tengah", -2.58, 115.38), place("hulu-sungai-utara", "kalsel", "Kabupaten Hulu Sungai Utara", -2.44, 115.17),
  place("tabalong", "kalsel", "Kabupaten Tabalong", -1.86, 115.57), place("tanah-bumbu", "kalsel", "Kabupaten Tanah Bumbu", -3.45, 115.70), place("balangan", "kalsel", "Kabupaten Balangan", -2.33, 115.61), place("kota-banjarmasin", "kalsel", "Kota Banjarmasin", -3.32, 114.59), place("kota-banjarbaru", "kalsel", "Kota Banjarbaru", -3.44, 114.84),
  place("paser", "kaltim", "Kabupaten Paser", -1.89, 116.20), place("kutai-barat", "kaltim", "Kabupaten Kutai Barat", -0.24, 115.09), place("kutai-kartanegara", "kaltim", "Kabupaten Kutai Kartanegara", -0.41, 116.99), place("kutai-timur", "kaltim", "Kabupaten Kutai Timur", 0.54, 117.53),
  place("berau", "kaltim", "Kabupaten Berau", 2.15, 117.50), place("penajam-paser-utara", "kaltim", "Kabupaten Penajam Paser Utara", -1.27, 116.60), place("mahakam-ulu", "kaltim", "Kabupaten Mahakam Ulu", 0.77, 114.89), place("kota-balikpapan", "kaltim", "Kota Balikpapan", -1.24, 116.86), place("kota-samarinda", "kaltim", "Kota Samarinda", -0.50, 117.15), place("kota-bontang", "kaltim", "Kota Bontang", 0.13, 117.50),
  place("bulungan", "kaltara", "Kabupaten Bulungan", 2.84, 117.37), place("malinau", "kaltara", "Kabupaten Malinau", 3.59, 116.62), place("nunukan", "kaltara", "Kabupaten Nunukan", 4.14, 117.67), place("tana-tidung", "kaltara", "Kabupaten Tana Tidung", 3.55, 117.08), place("kota-tarakan", "kaltara", "Kota Tarakan", 3.30, 117.63)
];

const aliases: Record<string, DemoLocation> = {
  "pontianak-sungai-jawi": { ...demoLocations.find((item) => item.id === "kota-pontianak")!, id: "pontianak-sungai-jawi", name: "Sungai Jawi", district: "Pontianak Kota", village: "Sungai Jawi", latitude: -0.0359, longitude: 109.3257 },
  "pontianak-benua-melayu": { ...demoLocations.find((item) => item.id === "kota-pontianak")!, id: "pontianak-benua-melayu", name: "Benua Melayu Darat", district: "Pontianak Selatan", village: "Benua Melayu Darat", latitude: -0.0438, longitude: 109.3475 },
  "palangkaraya-pahandut": { ...demoLocations.find((item) => item.id === "kota-palangkaraya")!, id: "palangkaraya-pahandut", name: "Pahandut", district: "Pahandut", village: "Pahandut", latitude: -2.2084, longitude: 113.9163 }
};

export function demoLocation(id: string): DemoLocation {
  const location = demoLocations.find((item) => item.id === id) ?? aliases[id];
  if (!location) throw new Error("Lokasi demo tidak ditemukan.");
  return location;
}
