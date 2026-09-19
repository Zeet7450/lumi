import assert from "node:assert/strict";
import test from "node:test";
import { liveDemoFixtures, simulationFixture } from "../domain/fixtures.js";
import { evaluateRulesetV1 } from "../domain/ruleset-v1.js";

test("ruleset-v1 fixtures produce the approved outcomes", () => {
  const monitor = evaluateRulesetV1(simulationFixture("MONITOR"));
  const verify = evaluateRulesetV1(simulationFixture("VERIFY"));
  const high = evaluateRulesetV1(simulationFixture("HIGH_PONTIANAK"));
  const stale = evaluateRulesetV1(simulationFixture("STALE"));

  assert.equal(monitor.kind, "DECISION");
  assert.equal(monitor.tier, "MONITOR");
  assert.equal(verify.kind, "DECISION");
  assert.equal(verify.tier, "VERIFY");
  assert.equal(high.kind, "DECISION");
  assert.equal(high.tier, "HIGH_RESPONSE");
  assert.equal(stale.kind, "NO_FRESH_DECISION");
  assert.equal(stale.freshness, "STALE");
});

test("ruleset-v1 is deterministic and does not call a provider", () => {
  const input = simulationFixture("HIGH_PONTIANAK");
  assert.deepEqual(evaluateRulesetV1(input), evaluateRulesetV1(structuredClone(input)));
});

test("live demo fixtures rebase timestamps to their injected runtime clock", () => {
  const runtimeNow = "2030-01-02T06:00:00.000Z";
  const fixtures = liveDemoFixtures(runtimeNow);
  assert.equal(fixtures.length, 2);
  for (const fixture of fixtures) {
    assert.equal(fixture.now, runtimeNow);
    assert.equal(fixture.snapshots.every((snapshot) => snapshot.retrievedAt === runtimeNow), true);
    assert.equal(fixture.snapshots.every((snapshot) => snapshot.freshness === "FRESH"), true);
  }
});

test("a lone hotspot is only an indication requiring verification", () => {
  const input = simulationFixture("MONITOR");
  input.snapshots.push({
    id: "single-hotspot",
    regionId: input.region.id,
    kind: "HOTSPOT",
    value: 1,
    source: "LUMI curated demo fixture",
    observedAt: "2026-09-08T05:00:00.000Z",
    retrievedAt: "2026-09-08T06:00:00.000Z",
    freshness: "FRESH",
    mode: "SIMULATION",
    hotspotDistanceKm: 8,
    note: "Indikasi anomali panas."
  });
  const outcome = evaluateRulesetV1(input);
  assert.equal(outcome.kind, "DECISION");
  assert.equal(outcome.tier, "VERIFY");
  assert.match(outcome.rationale[0] ?? "", /bukan kebakaran terkonfirmasi/);
});

test("a fresh hotspot without PM2.5 is still VERIFY, never a fire confirmation", () => {
  const input = simulationFixture("MONITOR");
  input.snapshots = [{
    id: "hotspot-only",
    regionId: input.region.id,
    kind: "HOTSPOT",
    value: 1,
    source: "LUMI curated demo fixture",
    observedAt: "2026-09-08T05:00:00.000Z",
    retrievedAt: "2026-09-08T06:00:00.000Z",
    freshness: "FRESH",
    mode: "SIMULATION",
    hotspotDistanceKm: 8,
    note: "Indikasi anomali panas."
  }];
  const outcome = evaluateRulesetV1(input);
  assert.equal(outcome.kind, "DECISION");
  assert.equal(outcome.tier, "VERIFY");
  assert.deepEqual(outcome.dataGaps, ["PM2.5 tidak tersedia."]);
});

test("stale PM2.5 deliberately has no replacement tier", () => {
  const outcome = evaluateRulesetV1(simulationFixture("STALE"));
  assert.equal(outcome.kind, "NO_FRESH_DECISION");
  assert.equal("tier" in outcome, false);
});
