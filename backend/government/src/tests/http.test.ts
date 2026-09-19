import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createDemoSystem } from "../application/demo-system.js";
import type { DemoPasswords } from "../application/government-service.js";
import type { RuntimeConfig } from "../application/runtime-config.js";
import { createGovernmentHttpServer } from "../http/server.js";

const passwords: DemoPasswords = {
  DLH: "dlh-demo-password",
  BPBD: "bpbd-demo-password",
  DISKOMINFO: "diskominfo-demo-password"
};

const config: RuntimeConfig = {
  port: 4000,
  opsOrigin: "http://localhost:3000",
  simulatorOrigin: "http://localhost:3002",
  sessionHmacKey: "test-session-key-that-is-long-enough-for-hmac",
  demoPasswords: passwords,
  cookieName: "lumi_ops_session",
  secureCookie: false
};

test("HTTP API keeps sessions server-side and rejects cross-origin mutation", async () => {
  const { service } = createDemoSystem(config.sessionHmacKey, passwords);
  const server = createGovernmentHttpServer({ service, config, log: () => undefined });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const backendOrigin = `http://127.0.0.1:${address.port}`;
  const opsOrigin = config.opsOrigin;
  try {
    const preflight = await fetch(`${backendOrigin}/api/ops/incidents`, {
      method: "OPTIONS",
      headers: {
        Origin: opsOrigin,
        "Access-Control-Request-Method": "PATCH",
        "Access-Control-Request-Headers": "content-type"
      }
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), opsOrigin);
    assert.equal(preflight.headers.get("access-control-allow-credentials"), "true");
    const login = await fetch(`${backendOrigin}/api/ops/login`, {
      method: "POST",
      headers: { Origin: opsOrigin, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "operator.dlh@demo.lumi.id", password: passwords.DLH, role: "DISKOMINFO" })
    });
    assert.equal(login.status, 200);
    const body = await login.json() as { token?: string; actor: { role: string; organization: string; jobTitle: string } };
    assert.equal(body.token, undefined);
    assert.equal(body.actor.role, "DLH");
    assert.equal(body.actor.organization, "Dinas Lingkungan Hidup (DLH)");
    assert.equal(body.actor.jobTitle, "Operator & Validator Kualitas Udara");
    assert.equal(login.headers.get("access-control-allow-origin"), opsOrigin);
    assert.equal(login.headers.get("access-control-allow-credentials"), "true");
    const cookie = login.headers.get("set-cookie");
    assert.ok(cookie?.includes("HttpOnly"));
    assert.ok(cookie?.includes("SameSite=Lax"));

    const restoredSession = await fetch(`${backendOrigin}/api/ops/session`, { headers: { Cookie: cookie!, Origin: opsOrigin } });
    assert.equal(restoredSession.status, 200);
    assert.equal((await restoredSession.json() as { actor: { role: string } }).actor.role, "DLH");
    const missingSession = await fetch(`${backendOrigin}/api/ops/session`, { headers: { Origin: opsOrigin } });
    assert.equal(missingSession.status, 401);

    const citizenLogin = await fetch(`${backendOrigin}/api/ops/login`, {
      method: "POST",
      headers: { Origin: opsOrigin, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "amelia.warga@demo.lumi.id", password: passwords.DLH })
    });
    assert.equal(citizenLogin.status, 200);
    const citizenCookie = citizenLogin.headers.get("set-cookie");
    const citizenOps = await fetch(`${backendOrigin}/api/ops/incidents`, { headers: { Cookie: citizenCookie!, Origin: opsOrigin } });
    assert.equal(citizenOps.status, 403);

    const incidents = await fetch(`${backendOrigin}/api/ops/incidents`, { headers: { Cookie: cookie!, Origin: opsOrigin } });
    assert.equal(incidents.status, 200);
    const simulatorLogin = await fetch(`${backendOrigin}/api/ops/login`, {
      method: "POST",
      headers: { Origin: config.simulatorOrigin, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "simulator@demo.lumi.id", password: passwords.DLH })
    });
    assert.equal(simulatorLogin.status, 200);
    const simulatorCookie = simulatorLogin.headers.get("set-cookie");
    const telemetry = await fetch(`${backendOrigin}/api/ops/demo-telemetry`, {
      method: "POST",
      headers: { Origin: config.simulatorOrigin, Cookie: simulatorCookie!, "Content-Type": "application/json" },
      body: JSON.stringify({ locationId: "pontianak-sungai-jawi", aqi: 163, hazards: [] })
    });
    assert.equal(telemetry.status, 201);
    assert.equal((await telemetry.json() as { status: string }).status, "ACCEPTED");
    const history = await fetch(`${backendOrigin}/api/ops/demo-telemetry/history?limit=8`, { headers: { Origin: config.simulatorOrigin, Cookie: simulatorCookie! } });
    assert.equal(history.status, 200);
    assert.equal((await history.json() as { deliveries: Array<{ locationName: string; status: string }> }).deliveries[0]?.locationName, "Sungai Jawi");
    const forbiddenHistory = await fetch(`${backendOrigin}/api/ops/demo-telemetry/history`, { headers: { Origin: opsOrigin, Cookie: cookie! } });
    assert.equal(forbiddenHistory.status, 403);
    const forbidden = await fetch(`${backendOrigin}/api/ops/refresh`, { method: "POST", headers: { Cookie: cookie!, Origin: "https://evil.example" } });
    assert.equal(forbidden.status, 403);
    const spoofedHost = await fetch(`${backendOrigin}/api/ops/login`, {
      method: "POST",
      headers: {
        Host: "evil.example",
        Origin: "https://evil.example",
        "X-Forwarded-Proto": "https",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: "operator.dlh@demo.lumi.id", password: passwords.DLH })
    });
    assert.equal(spoofedHost.status, 403);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("public API exposes only an approved projection and deterministic guidance", async () => {
  const { service } = createDemoSystem(config.sessionHmacKey, passwords);
  const server = createGovernmentHttpServer({ service, config, log: () => undefined });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const backendOrigin = `http://127.0.0.1:${address.port}`;
  try {
    const dlh = service.login("operator.dlh@demo.lumi.id", passwords.DLH).actor;
    const diskominfo = service.login("approver.diskominfo@demo.lumi.id", passwords.DISKOMINFO).actor;
    const high = (service.listIncidents(dlh) as Array<{ id: string; tier: string }>).find((incident) => incident.tier === "HIGH_RESPONSE");
    assert.ok(high);
    const draft = service.savePublicationDraft(dlh, high.id, { expectedRevision: 1, text: "Pembaruan publik yang sudah melewati approval manusia." });
    const draftResponse = await fetch(`${backendOrigin}/api/public/regions/pontianak`);
    assert.equal(draftResponse.status, 200);
    assert.deepEqual(await draftResponse.json(), { projection: null });
    const pending = service.submitPublication(dlh, high.id, { expectedRevision: draft.revision });
    const pendingResponse = await fetch(`${backendOrigin}/api/public/regions/pontianak`);
    assert.equal(pendingResponse.status, 200);
    assert.deepEqual(await pendingResponse.json(), { projection: null });
    service.approvePublication(diskominfo, pending.id, { expectedRevision: pending.revision });

    const published = await fetch(`${backendOrigin}/api/public/regions/pontianak`);
    assert.equal(published.status, 200);
    assert.equal(published.headers.get("cache-control"), "no-cache");
    const body = await published.json() as { projection: { notice: { tier: string; text: string } } };
    assert.equal(body.projection.notice.tier, "HIGH_RESPONSE");
    assert.equal(body.projection.notice.text, "Pembaruan publik yang sudah melewati approval manusia.");
    assert.deepEqual(Object.keys(body), ["projection"]);
    assert.deepEqual(Object.keys(body.projection).sort(), ["notice", "region"]);
    assert.deepEqual(Object.keys(body.projection.notice).sort(), ["currentFreshness", "dataObservedAt", "publishedAt", "sources", "text", "tier"]);

    const sameBodyWithOpsOrigin = await fetch(`${backendOrigin}/api/public/regions/pontianak`, {
      headers: { Origin: config.opsOrigin, Cookie: "lumi_ops_session=must-not-matter" }
    });
    assert.equal(sameBodyWithOpsOrigin.headers.get("access-control-allow-origin"), "*");
    assert.equal(sameBodyWithOpsOrigin.headers.get("access-control-allow-credentials"), null);
    assert.equal(sameBodyWithOpsOrigin.headers.get("set-cookie"), null);
    assert.deepEqual(await sameBodyWithOpsOrigin.json(), body);
    const evilOrigin = await fetch(`${backendOrigin}/api/public/regions/pontianak`, { headers: { Origin: "https://evil.example" } });
    assert.equal(evilOrigin.headers.get("access-control-allow-origin"), "*");

    const guidance = await fetch(`${backendOrigin}/api/public/guidance`);
    assert.equal(guidance.status, 200);
    assert.equal(guidance.headers.get("cache-control"), "public, max-age=3600");
    const guidanceBody = await guidance.json() as { guidance: { HIGH_RESPONSE: { tier: string; actions: string[] } } };
    assert.equal(guidanceBody.guidance.HIGH_RESPONSE.tier, "HIGH_RESPONSE");
    assert.ok(guidanceBody.guidance.HIGH_RESPONSE.actions.length > 0);

    const unknownRegion = await fetch(`${backendOrigin}/api/public/regions/tidak-ada`);
    assert.equal(unknownRegion.status, 404);
    const notificationInterest = await fetch(`${backendOrigin}/api/public/notification-interests`, { method: "POST" });
    assert.equal(notificationInterest.status, 404);
  } finally {
    server.close();
    await once(server, "close");
  }
});
