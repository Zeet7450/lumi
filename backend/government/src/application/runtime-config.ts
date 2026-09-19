import type { DemoPasswords } from "./government-service.js";

export interface RuntimeConfig {
  port: number;
  opsOrigin: string;
  simulatorOrigin: string;
  sessionHmacKey: string;
  demoPasswords: DemoPasswords;
  cookieName: string;
  secureCookie: boolean;
}

function requiredSecret(env: NodeJS.ProcessEnv, name: string, minimumLength: number): string {
  const value = env[name];
  if (!value || value.length < minimumLength) {
    throw new Error(`${name} harus disuntikkan melalui environment dan memenuhi panjang minimum.`);
  }
  return value;
}

function canonicalOpsOrigin(env: NodeJS.ProcessEnv, production: boolean): string {
  const configured = env.LUMI_OPS_ORIGIN ?? (production ? undefined : "http://localhost:3000");
  if (!configured) throw new Error("LUMI_OPS_ORIGIN wajib diatur pada production.");
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("LUMI_OPS_ORIGIN harus berupa origin absolut yang valid.");
  }
  if (parsed.origin === "null" || parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error("LUMI_OPS_ORIGIN hanya boleh memuat scheme, host, dan port.");
  }
  if (production && parsed.protocol !== "https:") throw new Error("LUMI_OPS_ORIGIN production wajib memakai HTTPS.");
  return parsed.origin;
}

/** P0 deliberately starts only from offline fixtures; it never falls back to cloud credentials. */
export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  if ((env.LUMI_STORAGE ?? "memory") !== "memory") {
    throw new Error("P0 hanya mendukung LUMI_STORAGE=memory; migration Supabase belum dijalankan.");
  }
  const port = Number(env.PORT ?? "4000");
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("PORT tidak valid.");
  const production = env.NODE_ENV === "production";
  return {
    port,
    opsOrigin: canonicalOpsOrigin(env, production),
    simulatorOrigin: canonicalSimulatorOrigin(env, production),
    sessionHmacKey: requiredSecret(env, "LUMI_SESSION_HMAC_KEY", 32),
    demoPasswords: {
      DLH: requiredSecret(env, "LUMI_DEMO_PASSWORD_DLH", 12),
      BPBD: requiredSecret(env, "LUMI_DEMO_PASSWORD_BPBD", 12),
      DISKOMINFO: requiredSecret(env, "LUMI_DEMO_PASSWORD_DISKOMINFO", 12),
      CITIZEN: env.LUMI_DEMO_PASSWORD_CITIZEN,
      ADMIN_DEMO: env.LUMI_DEMO_PASSWORD_ADMIN
    },
    cookieName: production ? "__Host-lumi_ops_session" : "lumi_ops_session",
    secureCookie: production
  };
}

function canonicalSimulatorOrigin(env: NodeJS.ProcessEnv, production: boolean): string {
  const value = env.LUMI_SIMULATOR_ORIGIN ?? (production ? undefined : "http://localhost:3002");
  if (!value) throw new Error("LUMI_SIMULATOR_ORIGIN wajib diatur pada production.");
  const copy = { ...env, LUMI_OPS_ORIGIN: value };
  return canonicalOpsOrigin(copy, production);
}
