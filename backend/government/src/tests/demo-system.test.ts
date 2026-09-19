import assert from "node:assert/strict";
import test from "node:test";
import { createDemoSystem } from "../application/demo-system.js";
import type { DemoPasswords } from "../application/government-service.js";

const passwords: DemoPasswords = {
  DLH: "dlh-demo-password",
  BPBD: "bpbd-demo-password",
  DISKOMINFO: "diskominfo-demo-password"
};

test("runtime demo sessions use the real current clock", () => {
  const before = Date.now();
  const { service } = createDemoSystem("test-session-key-that-is-long-enough-for-hmac", passwords);
  const login = service.login("operator.dlh@demo.lumi.id", passwords.DLH);
  const expiresAt = Date.parse(login.expiresAt);
  const after = Date.now();
  assert.ok(expiresAt >= before + 8 * 60 * 60_000);
  assert.ok(expiresAt <= after + 8 * 60 * 60_000);
});

test("fixture tests can still inject a fixed clock", () => {
  const { service } = createDemoSystem("test-session-key-that-is-long-enough-for-hmac", passwords, { now: () => "2026-09-08T06:00:00.000Z" });
  assert.equal(service.login("operator.dlh@demo.lumi.id", passwords.DLH).expiresAt, "2026-09-08T14:00:00.000Z");
});

test("the three government walkthrough identities, citizens, and isolated simulator are seeded", () => {
  const { service, repository } = createDemoSystem("test-session-key-that-is-long-enough-for-hmac", passwords);
  const login = service.login("operator.dlh@demo.lumi.id", passwords.DLH);
  assert.equal(login.actor.organization, "Dinas Lingkungan Hidup (DLH)");
  assert.equal(login.actor.jobTitle, "Operator & Validator Kualitas Udara");
  assert.equal(repository.getUserByEmail("koordinator.bpbd@demo.lumi.id")?.role, "BPBD");
  assert.equal(repository.getUserByEmail("approver.diskominfo@demo.lumi.id")?.role, "DISKOMINFO");
  assert.equal(repository.getUserByEmail("simulator@demo.lumi.id")?.role, "ADMIN_DEMO");
  assert.equal(repository.getUserByEmail("amelia.warga@demo.lumi.id")?.role, "CITIZEN");
  assert.equal(repository.getUserByEmail("joko.warga@demo.lumi.id")?.role, "CITIZEN");
  assert.equal(repository.getUserByEmail("nadia.warga@demo.lumi.id")?.role, "CITIZEN");
});
