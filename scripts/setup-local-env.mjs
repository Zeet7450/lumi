import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, ".env.local");
const linkedRef = join(root, "supabase", ".temp", "project-ref");

if (existsSync(linkedRef)) {
  throw new Error("Refusing to configure local credentials while a linked Supabase project is present.");
}

function parseEnv(source) {
  const values = new Map();
  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u.exec(line);
    if (!match) continue;
    let value = match[2];
    if (value.startsWith('"') && value.endsWith('"')) {
      value = JSON.parse(value);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    values.set(match[1], value);
  }
  return values;
}

function readLocalStatus() {
  let output;
  try {
    output = execFileSync("pnpm", ["supabase", "status", "-o", "env"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error("Local Supabase is not running. Start it with `pnpm supabase:start`.");
  }
  return parseEnv(output);
}

function requireValue(values, names) {
  for (const name of names) {
    const value = values.get(name);
    if (value) return value;
  }
  throw new Error(`Local Supabase status did not provide ${names.join(" or ")}.`);
}

function quote(value) {
  return JSON.stringify(value);
}

const existing = existsSync(target) ? parseEnv(readFileSync(target, "utf8")) : new Map();
const status = readLocalStatus();
const demoPassword = existing.get("DEMO_PASSWORD") ?? `${randomBytes(30).toString("base64url")}Aa1!`;
const hmacKey = existing.get("LUMI_SESSION_HMAC_KEY") ?? randomBytes(48).toString("base64url");

const normalized = new Map(existing);
normalized.set("DEMO_PASSWORD", demoPassword);
normalized.set("LUMI_SESSION_HMAC_KEY", hmacKey);
normalized.set("SUPABASE_URL", requireValue(status, ["API_URL"]));
normalized.set("SUPABASE_PUBLISHABLE_KEY", requireValue(status, ["PUBLISHABLE_KEY", "ANON_KEY"]));
normalized.set("SUPABASE_SECRET_KEY", requireValue(status, ["SECRET_KEY", "SERVICE_ROLE_KEY"]));
normalized.set("LUMI_DATABASE_URL", requireValue(status, ["DB_URL"]));
normalized.set("LUMI_STORAGE", normalized.get("LUMI_STORAGE") ?? "memory");
normalized.set("LUMI_OPS_ORIGIN", normalized.get("LUMI_OPS_ORIGIN") ?? "http://localhost:3000");
normalized.set("LUMI_SIMULATOR_ORIGIN", normalized.get("LUMI_SIMULATOR_ORIGIN") ?? "http://localhost:3002");

// Stage 1 keeps the fixture API unchanged. These compatibility variables are
// generated from the single demo secret and are removed with the Stage 2 adapter.
for (const suffix of ["DLH", "BPBD", "DINKES", "DISKOMINFO", "CITIZEN", "ADMIN"]) {
  normalized.set(`LUMI_DEMO_PASSWORD_${suffix}`, demoPassword);
}

const preferredOrder = [
  "DEMO_PASSWORD",
  "LUMI_SESSION_HMAC_KEY",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "LUMI_DATABASE_URL",
  "LUMI_STORAGE",
  "LUMI_OPS_ORIGIN",
  "LUMI_SIMULATOR_ORIGIN",
  "LUMI_DEMO_PASSWORD_DLH",
  "LUMI_DEMO_PASSWORD_BPBD",
  "LUMI_DEMO_PASSWORD_DINKES",
  "LUMI_DEMO_PASSWORD_DISKOMINFO",
  "LUMI_DEMO_PASSWORD_CITIZEN",
  "LUMI_DEMO_PASSWORD_ADMIN",
];
const remaining = [...normalized.keys()].filter((key) => !preferredOrder.includes(key)).sort();
const lines = [...preferredOrder, ...remaining]
  .filter((key) => normalized.has(key))
  .map((key) => `${key}=${quote(normalized.get(key))}`);

const temporary = `${target}.tmp-${process.pid}-${randomBytes(6).toString("hex")}`;
writeFileSync(temporary, `${lines.join("\n")}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
chmodSync(temporary, 0o600);
renameSync(temporary, target);
chmodSync(target, 0o600);

process.stdout.write("Local environment configured in ignored .env.local with mode 0600.\n");
