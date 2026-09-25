import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const directory = join(process.cwd(), "local-demo-data");
const file = join(directory, "state.json");
const uploads = join(directory, "uploads");
const empty = { version: 1, synthetic: true, scenario: null, notices: [], reports: [], citizens: [] };
await mkdir(directory, { recursive: true });
await mkdir(uploads, { recursive: true });
let state = existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : empty;
if (state?.synthetic !== true) state = empty;
const allowedOrigin = (req) => ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"].includes(req.headers.origin) ? req.headers.origin : "http://localhost:3001";
const send = (req, res, code, body) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": allowedOrigin(req) }); res.end(JSON.stringify(body)); };
const persist = async () => writeFile(file, JSON.stringify(state), { mode: 0o600 });

createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, { "access-control-allow-origin": allowedOrigin(req), "access-control-allow-methods": "GET,POST", "access-control-allow-headers": "content-type" }); return res.end(); }
  if (req.url === "/health") return send(req, res, 200, { ok: true, synthetic: true });
  if (req.url === "/state" && req.method === "GET") return send(req, res, 200, state);
  if (req.url === "/state" && req.method === "POST") {
    let data = ""; for await (const chunk of req) data += chunk;
    try { const incoming = JSON.parse(data); if (incoming?.synthetic !== true) return send(req, res, 400, { error: "Hanya data sintetis yang diizinkan." }); state = { ...state, ...incoming, synthetic: true }; await persist(); return send(req, res, 200, state); }
    catch { return send(req, res, 400, { error: "Data demo tidak valid." }); }
  }
  if (req.url === "/reports" && req.method === "POST") {
    let data = ""; for await (const chunk of req) data += chunk;
    try {
      const report = JSON.parse(data);
      if (!report || typeof report.description !== "string" || typeof report.location !== "string" || report.description.trim().length < 8 || !Array.isArray(report.images) || report.images.length > 3) return send(req, res, 400, { error: "Laporan demo belum lengkap." });
      const id = `laporan-${Date.now()}`;
      const imageNames = [];
      for (let index = 0; index < report.images.length; index += 1) {
        const image = report.images[index];
        if (typeof image !== "string" || !image.startsWith("data:image/")) continue;
        const encoded = image.split(",")[1] ?? "";
        const name = `${id}-${index}.bin`;
        await writeFile(join(uploads, name), Buffer.from(encoded, "base64"), { mode: 0o600 });
        imageNames.push(name);
      }
      // Reports are provincial: queue names the agency AND province so each
      // BPBD/DLH command center only ever sees its own province's inbox.
      const province = typeof report.province === "string" && report.province.trim() ? report.province.trim() : "Kalimantan Barat";
      const queueAgency = /asap|udara/i.test(String(report.category ?? "")) ? "DLH" : "BPBD";
      state.reports = [...(state.reports ?? []), { id, synthetic: true, createdAt: new Date().toISOString(), status: "Menunggu verifikasi", category: String(report.category ?? "Kondisi lingkungan"), location: report.location, province, description: report.description.trim(), citizen: String(report.citizen ?? "Warga demo"), images: imageNames, queue: queueAgency, queueProvince: province, queueLabel: `${queueAgency} ${province}` }];
      await persist(); return send(req, res, 201, { ok: true, id });
    } catch { return send(req, res, 400, { error: "Laporan demo tidak dapat dibaca." }); }
  }
  return send(req, res, 404, { error: "Rute demo lokal tidak ditemukan." });
}).listen(3100, "127.0.0.1", () => console.log("LUMI state demo lokal aktif pada http://127.0.0.1:3100"));
