import assert from "node:assert/strict";
import test from "node:test";
import { loadRuntimeConfig } from "../application/runtime-config.js";

function productionEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    LUMI_STORAGE: "memory",
    LUMI_OPS_ORIGIN: "https://ops.lumi.example",
    LUMI_SIMULATOR_ORIGIN: "https://simulator.lumi.example",
    LUMI_SESSION_HMAC_KEY: "a-session-hmac-key-that-is-long-enough",
    LUMI_DEMO_PASSWORD_DLH: "dlh-demo-password",
    LUMI_DEMO_PASSWORD_BPBD: "bpbd-demo-password",
    LUMI_DEMO_PASSWORD_DISKOMINFO: "diskominfo-demo-password",
    ...overrides
  };
}

test("production runtime config requires an exact HTTPS ops origin and secure host cookie", () => {
  const config = loadRuntimeConfig(productionEnv());
  assert.equal(config.opsOrigin, "https://ops.lumi.example");
  assert.equal(config.simulatorOrigin, "https://simulator.lumi.example");
  assert.equal(config.secureCookie, true);
  assert.equal(config.cookieName, "__Host-lumi_ops_session");

  assert.throws(() => loadRuntimeConfig(productionEnv({ LUMI_OPS_ORIGIN: "http://ops.lumi.example" })), /HTTPS/);
  assert.throws(() => loadRuntimeConfig(productionEnv({ LUMI_OPS_ORIGIN: "https://ops.lumi.example/ops" })), /scheme, host, dan port/);
  assert.throws(() => loadRuntimeConfig(productionEnv({ LUMI_STORAGE: "supabase" })), /hanya mendukung/);
});
