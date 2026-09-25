/**
 * Seed 5 kasus demo status DETECTED untuk testing manual alur verifikasi.
 *
 * Kasus dibuat melalui applyCaseCommand (event CREATE_CASE oleh SIMULATOR),
 * lalu divalidasi dengan isDemoCaseState — persis seperti yang dipakai store
 * browser — supaya yang tersimpan di bridge terjamin legal dan bisa di-replay
 * oleh validator di dashboard DLH/BPBD tanpa ditolak.
 *
 * Pakai: node scripts/seed-demo-cases.mjs [--clear]
 *   --clear: kosongkan semua kasus dulu sebelum seed.
 */
import { spawnSync } from "node:child_process";

const clear = process.argv.includes("--clear");
const now = Date.now();

// Realistic Kalimantan scenarios; the case id must equal `kasus-${createdAt}`.
const seeds = [
  {
    offsetMinutes: 48,
    source: {
      classification: "Kebakaran lahan",
      region: { name: "Kota Singkawang", province: "Kalimantan Barat", slug: "singkawang" },
      observation: { aqi: 96, pm25: 35, wind: "3 km/jam dari Tenggara" }
    },
    intent: "Skala kecil, gejala ringan — alamiah untuk diuji jalur Selesai langsung di BPBD (tanpa eskalasi)."
  },
  {
    offsetMinutes: 41,
    source: {
      classification: "Pencemaran/kabut asap",
      region: { name: "Kota Pontianak", province: "Kalimantan Barat", slug: "pontianak" },
      observation: { aqi: 71, pm25: 22, wind: "2 km/jam dari Barat" }
    },
    intent: "Sinyal lemah/meragukan — alamiah untuk diuji jalur Tolak di DLH Provinsi."
  },
  {
    offsetMinutes: 33,
    source: {
      classification: "Kebakaran lahan",
      region: { name: "Kab. Kubu Raya", province: "Kalimantan Tengah", slug: "kubu-raya" },
      observation: { aqi: 288, pm25: 145, wind: "6 km/jam dari Selatan" }
    },
    intent: "Skala besar/parah, AQI tinggi — alamiah untuk diuji jalur eskalasi penuh sampai BNPB & KLHK."
  },
  {
    offsetMinutes: 26,
    source: {
      classification: "Pencemaran/kabut asap",
      region: { name: "Kab. Banjar", province: "Kalimantan Selatan", slug: "banjar" },
      observation: { aqi: 164, pm25: 71, wind: "4 km/jam dari Barat Daya" }
    },
    intent: "Skala menengah — alamiah untuk diuji DLH menandai butuh bantuan KLHK."
  },
  {
    offsetMinutes: 12,
    source: {
      classification: "Kebakaran lahan",
      region: { name: "Kab. Kutai Kartanegara", province: "Kalimantan Timur", slug: "kutai-kartanegara" },
      observation: { aqi: 132, pm25: 55, wind: "5 km/jam dari Tenggara" }
    },
    intent: "Provinsi kelima untuk tambahan variasi data peta."
  }
];

// Run the real library through node's type-stripping loader so validation
// matches the browser store exactly.
const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "--eval", `
import { applyCaseCommand, isDemoCaseState, serializeDemoCaseState } from ${JSON.stringify(new URL("../apps/web/src/lib/demo-cases.ts", import.meta.url).pathname)};
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const file = ${JSON.stringify(new URL("../local-demo-data/state.json", import.meta.url).pathname)};
const seeds = ${JSON.stringify(seeds)};
const clear = ${JSON.stringify(clear)};
const now = Date.now();

let caseState = { version: 1, isSynthetic: true, cases: [], seen: {} };
try {
  const raw = JSON.parse(await readFile(file, "utf8"));
  if (clear) throw new Error("clear");
  if (raw?.caseState) caseState = raw.caseState;
} catch {}

let state = caseState;
const seeded = [];
for (const [index, seed] of seeds.entries()) {
  const at = new Date(now - seed.offsetMinutes * 60_000).toISOString();
  try {
    state = applyCaseCommand(state, { type: "CREATE_CASE", actor: "SIMULATOR", source: seed.source }, at);
    seeded.push({ id: \`kasus-\${at}\`, region: seed.source.region.name, province: seed.source.region.province, aqi: seed.source.observation.aqi, intent: seed.intent });
  } catch (error) {
    console.error(\`Kasus \${index + 1} (\${seed.source.region.name}) gagal: \${error.message}\`);
  }
}

if (!isDemoCaseState(state)) {
  console.error("Hasil seed tidak lolos isDemoCaseState — tidak disimpan.");
  process.exit(1);
}

let disk = {};
try { disk = JSON.parse(await readFile(file, "utf8")); } catch {}
disk.caseState = JSON.parse(serializeDemoCaseState(state));
await writeFile(file, JSON.stringify(disk));
console.log(JSON.stringify({ ok: true, seeded, total: disk.caseState.cases.length }, null, 2));
`], { stdio: "inherit", cwd: process.cwd() });

process.exit(result.status ?? 1);
