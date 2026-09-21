import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const directory = join(process.cwd(), "local-demo-data");
const file = join(directory, "state.json");
const empty = { version: 1, synthetic: true, scenario: null, notices: [], reports: [], citizens: [] };
await mkdir(directory, { recursive: true });
let state = existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : empty;
if (state?.synthetic !== true) state = empty;
const send = (res, code, body) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "http://localhost:3001" }); res.end(JSON.stringify(body)); };
const persist = async () => writeFile(file, JSON.stringify(state), { mode: 0o600 });

createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, { "access-control-allow-origin": "http://localhost:3001", "access-control-allow-methods": "GET,POST" }); return res.end(); }
  if (req.url === "/health") return send(res, 200, { ok: true, synthetic: true });
  if (req.url === "/state" && req.method === "GET") return send(res, 200, state);
  if (req.url === "/state" && req.method === "POST") {
    let data = ""; for await (const chunk of req) data += chunk;
    try { const incoming = JSON.parse(data); if (incoming?.synthetic !== true) return send(res, 400, { error: "Hanya data sintetis yang diizinkan." }); state = { ...state, ...incoming, synthetic: true }; await persist(); return send(res, 200, state); }
    catch { return send(res, 400, { error: "Data demo tidak valid." }); }
  }
  return send(res, 404, { error: "Rute demo lokal tidak ditemukan." });
}).listen(3100, "127.0.0.1", () => console.log("LUMI state demo lokal aktif pada http://127.0.0.1:3100"));
