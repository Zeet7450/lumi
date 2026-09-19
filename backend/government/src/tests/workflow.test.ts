import assert from "node:assert/strict";
import test from "node:test";
import type { DemoPasswords } from "../application/government-service.js";
import { GovernmentService, type Actor } from "../application/government-service.js";
import { createDemoSystem } from "../application/demo-system.js";
import { ApplicationError } from "../application/errors.js";
import { DEMO_NOW, regions, simulationFixture } from "../domain/fixtures.js";
import { InMemoryGovernmentRepository } from "../repositories/in-memory-government-repository.js";

const passwords: DemoPasswords = {
  DLH: "dlh-demo-password",
  BPBD: "bpbd-demo-password",
  DISKOMINFO: "diskominfo-demo-password"
};

function setup() {
  return createDemoSystem("test-session-key-that-is-long-enough-for-hmac", passwords, { now: () => DEMO_NOW });
}

function actors(service: ReturnType<typeof setup>["service"]) {
  return {
    dlh: service.login("operator.dlh@demo.lumi.id", passwords.DLH).actor,
    bpbd: service.login("koordinator.bpbd@demo.lumi.id", passwords.BPBD).actor,
    diskominfo: service.login("approver.diskominfo@demo.lumi.id", passwords.DISKOMINFO).actor,
    admin: {
      userId: "test-admin-only",
      role: "ADMIN_DEMO",
      displayName: "Test Admin",
      organization: "Test Only",
      jobTitle: "Test Only"
    } satisfies Actor
  };
}

test("only permitted roles can act, and a published notice reaches the safe projection", () => {
  const { service } = setup();
  const { dlh, bpbd, diskominfo } = actors(service);
  const incidents = service.listIncidents(dlh) as Array<{ id: string; tier: string }>;
  const high = incidents.find((incident) => incident.tier === "HIGH_RESPONSE");
  assert.ok(high);
  assert.equal((service.listIncidents(bpbd) as Array<{ tier: string }>).every((incident) => incident.tier === "HIGH_RESPONSE"), true);
  assert.throws(() => service.updateBrief(bpbd, high.id, { expectedRevision: 1, reviewNote: "Tidak diizinkan.", actions: [] }), ApplicationError);

  const detail = service.getIncident(dlh, high.id) as { actionBrief: { revision: number }; region: { slug: string } };
  const brief = service.updateBrief(dlh, high.id, {
    expectedRevision: detail.actionBrief.revision,
    reviewNote: "Data diperiksa untuk demo.",
    actions: [{ actionId: "CHECK_FRESHNESS", owner: "DLH", text: "Periksa kesegaran data terbaru." }]
  });
  assert.equal(brief.revision, 2);

  const draft = service.savePublicationDraft(dlh, high.id, {
    expectedRevision: 1,
    text: "Kualitas udara di Pontianak memburuk. Kurangi aktivitas luar ruang bila memungkinkan."
  });
  const pending = service.submitPublication(dlh, high.id, { expectedRevision: draft.revision });
  const published = service.approvePublication(diskominfo, pending.id, { expectedRevision: pending.revision });
  assert.equal(published.status, "PUBLISHED");

  const projection = service.publicProjectionForRegion("region-pontianak");
  assert.ok(projection);
  assert.equal(projection.notice.tier, "HIGH_RESPONSE");
  const serialized = JSON.stringify(projection);
  for (const forbiddenField of ["rejectionNote", "actorId", "evidence", "simulation", "password", "audit"]) {
    assert.equal(serialized.includes(forbiddenField), false);
  }
  assert.ok(service.listAuditForTest().some((event) => event.action === "PUBLICATION_APPROVED"));
});

test("approval revision protects against duplicate requests", () => {
  const { service } = setup();
  const { dlh, diskominfo } = actors(service);
  const high = (service.listIncidents(dlh) as Array<{ id: string; tier: string }>).find((incident) => incident.tier === "HIGH_RESPONSE");
  assert.ok(high);
  const draft = service.savePublicationDraft(dlh, high.id, { expectedRevision: 1, text: "Pesan publik untuk diuji dalam alur approval LUMI." });
  const pending = service.submitPublication(dlh, high.id, { expectedRevision: draft.revision });
  assert.equal(service.approvePublication(diskominfo, pending.id, { expectedRevision: pending.revision }).status, "PUBLISHED");
  assert.throws(() => service.approvePublication(diskominfo, pending.id, { expectedRevision: pending.revision }), (error: unknown) => error instanceof ApplicationError && error.code === "CONFLICT");
});

test("a correction supersedes, rather than edits, the published notice", () => {
  const { service, repository } = setup();
  const { dlh, diskominfo } = actors(service);
  const high = (service.listIncidents(dlh) as Array<{ id: string; tier: string }>).find((incident) => incident.tier === "HIGH_RESPONSE");
  assert.ok(high);
  const firstDraft = service.savePublicationDraft(dlh, high.id, { expectedRevision: 1, text: "Pesan publik pertama untuk alur koreksi LUMI." });
  const firstPending = service.submitPublication(dlh, high.id, { expectedRevision: firstDraft.revision });
  const firstPublished = service.approvePublication(diskominfo, firstPending.id, { expectedRevision: firstPending.revision });

  const correction = service.savePublicationDraft(dlh, high.id, { expectedRevision: 1, text: "Pesan publik revisi untuk alur koreksi LUMI." });
  assert.equal(correction.supersedesNoticeId, firstPublished.id);
  const pendingCorrection = service.submitPublication(dlh, high.id, { expectedRevision: correction.revision });
  const publishedCorrection = service.approvePublication(diskominfo, pendingCorrection.id, { expectedRevision: pendingCorrection.revision });
  assert.equal(repository.getNotice(firstPublished.id)?.text, firstPublished.text);
  assert.ok(repository.getNotice(firstPublished.id)?.supersededAt);
  assert.equal(repository.getActivePublishedNoticeForRegion("region-pontianak")?.id, publishedCorrection.id);
});

test("simulation stays isolated from incidents and public notices", () => {
  const { service, repository } = setup();
  const { admin, dlh } = actors(service);
  const incidentCount = repository.listIncidents().length;
  const run = service.runSimulation(admin, "HIGH_PONTIANAK");
  assert.equal(run.mode, "SIMULATION");
  assert.equal(repository.listIncidents().length, incidentCount);
  assert.equal(repository.getLatestNoticeForIncident(run.id), undefined);
  assert.equal(service.publicProjectionForRegion("region-pontianak"), null);
  assert.throws(() => service.getSimulation(dlh, run.id), ApplicationError);
});

test("admin demo telemetry updates the operational dashboard without granting ingestion to operators", () => {
  const { service } = setup();
  const { admin, dlh } = actors(service);

  const received = service.ingestDemoTelemetry(admin, {
    locationId: "pontianak-sungai-jawi",
    aqi: 163,
    hazards: []
  });
  const dashboard = service.dashboard(dlh);
  const pontianak = dashboard.regions.find((region) => region.slug === "pontianak");

  assert.equal(received.status, "ACCEPTED");
  assert.equal(pontianak?.pm25, 72.6);
  assert.equal(pontianak?.aqi, 163);
  assert.equal(pontianak?.tier, "HIGH_RESPONSE");
  const pontianakPoint = dashboard.mapPoints.find((point) => point.id === "kota-pontianak");
  assert.equal(pontianakPoint?.radiusKm, 8);
  assert.equal(pontianakPoint?.city, "Kota Pontianak");
  assert.equal(pontianakPoint?.administrativeBoundary, null);
  assert.equal(dashboard.trend.at(-1)?.pm25, 72.6);
  assert.deepEqual(service.listDemoTelemetryHistory(admin)[0], {
    id: received.id,
    receivedAt: received.receivedAt,
    locationName: "Sungai Jawi",
    aqi: 163,
    status: "ACCEPTED"
  });
  assert.throws(() => service.listDemoTelemetryHistory(dlh), (error: unknown) => error instanceof ApplicationError && error.code === "FORBIDDEN");
  assert.throws(
    () => service.ingestDemoTelemetry(dlh, {
      locationId: "kota-pontianak",
      aqi: 20,
      hazards: []
    }),
    (error: unknown) => error instanceof ApplicationError && error.code === "FORBIDDEN"
  );
});

test("hazard severity sets a minimum operational tier without exposing simulator details publicly", () => {
  const { service } = setup();
  const { admin, dlh } = actors(service);
  service.ingestDemoTelemetry(admin, {
    locationId: "kota-banjarmasin", aqi: 42,
    hazards: [{ type: "FLOOD", severity: 3 }]
  });
  const dashboard = service.dashboard(dlh);
  const point = dashboard.mapPoints.find((item) => item.id === "kota-banjarmasin");
  assert.equal(point?.tier, "HIGH_RESPONSE");
  assert.deepEqual(point?.hazards, [{ type: "FLOOD", severity: 3 }]);
  assert.equal(service.publicProjectionForRegionSlug("kota-banjarmasin"), null);
});

test("fixture refresh advances the open incident to the latest LIVE decision", () => {
  const { service } = setup();
  const { admin, dlh } = actors(service);
  const high = (service.listIncidents(dlh) as Array<{ id: string; tier: string }>).find((incident) => incident.tier === "HIGH_RESPONSE");
  assert.ok(high);
  const before = service.getIncident(dlh, high.id) as { dataVersion: number };
  const refresh = service.refreshFixtures(admin);
  const after = service.getIncident(dlh, high.id) as { dataVersion: number };
  assert.equal(refresh.decisionsCreated, 2);
  assert.equal(after.dataVersion, before.dataVersion + 1);
});

test("a live refresh never rewrites evidence referenced by an earlier decision", () => {
  let now = DEMO_NOW;
  const { service, repository } = createDemoSystem("test-session-key-that-is-long-enough-for-hmac", passwords, { now: () => now });
  const { admin } = actors(service);
  const beforeDecision = repository.getLatestDecisionForRegion("region-pontianak");
  assert.ok(beforeDecision);
  const beforeEvidence = repository.getSnapshots(beforeDecision.evidenceIds);

  now = "2026-09-08T06:30:00.000Z";
  service.refreshFixtures(admin);

  assert.notEqual(repository.getLatestDecisionForRegion("region-pontianak")?.id, beforeDecision.id);
  assert.deepEqual(repository.getSnapshots(beforeDecision.evidenceIds), beforeEvidence);
});

test("a stale refresh preserves the published tier but reports stale current data", () => {
  const { service } = setup();
  const { dlh, diskominfo } = actors(service);
  const high = (service.listIncidents(dlh) as Array<{ id: string; tier: string }>).find((incident) => incident.tier === "HIGH_RESPONSE");
  assert.ok(high);
  const draft = service.savePublicationDraft(dlh, high.id, { expectedRevision: 1, text: "Pesan publik untuk uji kesegaran data stale LUMI." });
  const pending = service.submitPublication(dlh, high.id, { expectedRevision: draft.revision });
  service.approvePublication(diskominfo, pending.id, { expectedRevision: pending.revision });

  const staleFixture = simulationFixture("STALE");
  const liveStaleFixture = {
    ...staleFixture,
    mode: "LIVE" as const,
    snapshots: staleFixture.snapshots.map((snapshot) => ({ ...snapshot, mode: "LIVE" as const, retrievedAt: "2026-09-08T06:01:00.000Z" }))
  };
  const internal = service as unknown as { persistLiveInput(input: typeof liveStaleFixture): unknown };
  internal.persistLiveInput(liveStaleFixture);

  const incident = (service.listIncidents(dlh) as Array<{ id: string; tier: string; freshness: string }>).find((item) => item.id === high.id);
  assert.equal(incident?.tier, "HIGH_RESPONSE");
  assert.equal(incident?.freshness, "STALE");
  const projection = service.publicProjectionForRegion("region-pontianak");
  assert.equal(projection?.notice.tier, "HIGH_RESPONSE");
  assert.equal(projection?.notice.currentFreshness, "STALE");

  const freshFixture = simulationFixture("HIGH_PONTIANAK");
  const liveFreshFixture = {
    ...freshFixture,
    mode: "LIVE" as const,
    snapshots: freshFixture.snapshots.map((snapshot) => ({ ...snapshot, mode: "LIVE" as const, retrievedAt: "2026-09-08T06:02:00.000Z" }))
  };
  internal.persistLiveInput(liveFreshFixture);
  const refreshedIncident = (service.listIncidents(dlh) as Array<{ id: string; freshness: string }>).find((item) => item.id === high.id);
  assert.equal(refreshedIncident?.freshness, "FRESH");
  assert.equal(service.publicProjectionForRegion("region-pontianak")?.notice.currentFreshness, "FRESH");
});

test("current freshness ages even when no ingestion refresh occurs", () => {
  let now = DEMO_NOW;
  const { service } = createDemoSystem("test-session-key-that-is-long-enough-for-hmac", passwords, { now: () => now });
  const { dlh, diskominfo } = actors(service);
  const high = (service.listIncidents(dlh) as Array<{ id: string; tier: string }>).find((incident) => incident.tier === "HIGH_RESPONSE");
  assert.ok(high);
  const draft = service.savePublicationDraft(dlh, high.id, { expectedRevision: 1, text: "Pesan publik untuk pengujian data yang menua." });
  const pending = service.submitPublication(dlh, high.id, { expectedRevision: draft.revision });
  service.approvePublication(diskominfo, pending.id, { expectedRevision: pending.revision });

  now = "2026-09-08T10:00:00.000Z";
  const incident = (service.listIncidents(dlh) as Array<{ id: string; freshness: string }>).find((item) => item.id === high.id);
  assert.equal(incident?.freshness, "STALE");
  const detail = service.getIncident(dlh, high.id) as { evidence: Array<{ kind: string; freshness: string }> };
  assert.equal(detail.evidence.filter((snapshot) => snapshot.kind === "PM25").every((snapshot) => snapshot.freshness === "STALE"), true);
  assert.equal(service.publicProjectionForRegion("region-pontianak")?.notice.currentFreshness, "STALE");
});

test("a published notice stays bound to its approved decision until a new approval", () => {
  const { service } = setup();
  const { dlh, diskominfo } = actors(service);
  const high = (service.listIncidents(dlh) as Array<{ id: string; tier: string }>).find((incident) => incident.tier === "HIGH_RESPONSE");
  assert.ok(high);
  const draft = service.savePublicationDraft(dlh, high.id, { expectedRevision: 1, text: "Pesan publik yang terikat pada keputusan yang telah disetujui." });
  const pending = service.submitPublication(dlh, high.id, { expectedRevision: draft.revision });
  service.approvePublication(diskominfo, pending.id, { expectedRevision: pending.revision });

  const highFixture = simulationFixture("HIGH_PONTIANAK");
  const freshVerifyInput = {
    ...highFixture,
    mode: "LIVE" as const,
    snapshots: highFixture.snapshots
      .filter((snapshot) => snapshot.kind === "PM25")
      .slice(0, 1)
      .map((snapshot) => ({
        ...snapshot,
        id: "obs-pontianak-pm25-verify-after-publish",
        value: 42,
        observedAt: "2026-09-08T05:30:00.000Z",
        retrievedAt: "2026-09-08T06:03:00.000Z",
        mode: "LIVE" as const
      }))
  };
  const internal = service as unknown as { persistLiveInput(input: typeof freshVerifyInput): unknown };
  internal.persistLiveInput(freshVerifyInput);

  const currentIncident = service.getIncident(dlh, high.id) as { decision: { tier: string } };
  assert.equal(currentIncident.decision.tier, "VERIFY");
  assert.equal(service.publicProjectionForRegion("region-pontianak")?.notice.tier, "HIGH_RESPONSE");
});

test("approval rejects a draft when its reviewed decision is no longer current", () => {
  const { service } = setup();
  const { dlh, diskominfo } = actors(service);
  const high = (service.listIncidents(dlh) as Array<{ id: string; tier: string }>).find((incident) => incident.tier === "HIGH_RESPONSE");
  assert.ok(high);
  const draft = service.savePublicationDraft(dlh, high.id, { expectedRevision: 1, text: "Pesan yang harus ditinjau ulang bila data berubah." });
  const pending = service.submitPublication(dlh, high.id, { expectedRevision: draft.revision });

  const highFixture = simulationFixture("HIGH_PONTIANAK");
  const freshVerifyInput = {
    ...highFixture,
    mode: "LIVE" as const,
    snapshots: highFixture.snapshots
      .filter((snapshot) => snapshot.kind === "PM25")
      .slice(0, 1)
      .map((snapshot) => ({ ...snapshot, id: "obs-pontianak-pm25-verify-before-approval", value: 42, mode: "LIVE" as const }))
  };
  const internal = service as unknown as { persistLiveInput(input: typeof freshVerifyInput): unknown };
  internal.persistLiveInput(freshVerifyInput);

  assert.throws(
    () => service.approvePublication(diskominfo, pending.id, { expectedRevision: pending.revision }),
    (error: unknown) => error instanceof ApplicationError && error.code === "CONFLICT"
  );
  assert.equal(service.publicProjectionForRegion("region-pontianak"), null);
});

test("a fresh monitor decision resolves the incident and blocks an older pending approval", () => {
  const { service } = setup();
  const { dlh, diskominfo } = actors(service);
  const high = (service.listIncidents(dlh) as Array<{ id: string; tier: string }>).find((incident) => incident.tier === "HIGH_RESPONSE");
  assert.ok(high);
  const draft = service.savePublicationDraft(dlh, high.id, { expectedRevision: 1, text: "Pesan yang harus dibatalkan setelah kondisi membaik." });
  const pending = service.submitPublication(dlh, high.id, { expectedRevision: draft.revision });

  const monitorFixture = simulationFixture("MONITOR");
  const liveMonitorInput = {
    ...monitorFixture,
    mode: "LIVE" as const,
    snapshots: monitorFixture.snapshots.map((snapshot) => ({ ...snapshot, mode: "LIVE" as const }))
  };
  const internal = service as unknown as { persistLiveInput(input: typeof liveMonitorInput): unknown };
  internal.persistLiveInput(liveMonitorInput);

  const resolved = service.getIncident(dlh, high.id) as { workflowStatus: string; decision: { tier: string } };
  assert.equal(resolved.workflowStatus, "RESOLVED");
  assert.equal(resolved.decision.tier, "MONITOR");
  assert.equal((service.listIncidents(dlh) as Array<{ id: string }>).some((incident) => incident.id === high.id), false);
  assert.throws(
    () => service.approvePublication(diskominfo, pending.id, { expectedRevision: pending.revision }),
    (error: unknown) => error instanceof ApplicationError && error.code === "CONFLICT"
  );
});

test("public projection never substitutes publication time for a missing observation", () => {
  const repository = new InMemoryGovernmentRepository(regions);
  const service = new GovernmentService(repository, "test-session-key-that-is-long-enough-for-hmac", { now: () => "2026-09-08T06:00:00.000Z" });
  repository.saveDecision({
    id: "decision-no-current-snapshot",
    regionId: "region-pontianak",
    tier: "VERIFY",
    rationale: ["Keputusan sebelumnya tetap tersedia."],
    evidenceIds: [],
    dataGaps: ["Data PM2.5 tidak tersedia."],
    ownerHints: ["DLH", "DINKES"],
    policyVersion: "ruleset-v1",
    decidedAt: "2026-09-08T05:00:00.000Z",
    mode: "LIVE"
  });
  repository.saveIncident({
    id: "incident-no-current-snapshot",
    regionId: "region-pontianak",
    decisionId: "decision-no-current-snapshot",
    workflowStatus: "OPEN",
    dataVersion: 1,
    updatedAt: "2026-09-08T05:00:00.000Z"
  });
  repository.saveNotice({
    id: "notice-no-current-snapshot",
    incidentId: "incident-no-current-snapshot",
    decisionId: "decision-no-current-snapshot",
    regionId: "region-pontianak",
    text: "Pesan yang telah disetujui tanpa data terbaru.",
    status: "PUBLISHED",
    revision: 3,
    publishedAt: "2026-09-08T05:05:00.000Z",
    createdAt: "2026-09-08T05:00:00.000Z",
    updatedAt: "2026-09-08T05:05:00.000Z"
  });

  const projection = service.publicProjectionForRegion("region-pontianak");
  assert.equal(projection?.notice.currentFreshness, "UNAVAILABLE");
  assert.equal(projection?.notice.dataObservedAt, null);
  assert.deepEqual(projection?.notice.sources, []);

  repository.saveSnapshots([{
    id: "snapshot-untrusted-public-source",
    regionId: "region-pontianak",
    kind: "PM25",
    value: 42,
    unit: "ug/m3",
    source: "https://provider.example/current?api_key=secret-value",
    observedAt: "2026-09-08T05:30:00.000Z",
    retrievedAt: "2026-09-08T05:31:00.000Z",
    freshness: "FRESH",
    mode: "LIVE"
  }]);
  const safeProjection = service.publicProjectionForRegion("region-pontianak");
  assert.deepEqual(safeProjection?.notice.sources, ["Sumber data terverifikasi LUMI"]);
  const serialized = JSON.stringify(safeProjection);
  assert.equal(serialized.includes("provider.example"), false);
  assert.equal(serialized.includes("secret-value"), false);
});

test("the live persistence boundary rejects simulation input even if called incorrectly", () => {
  const { service, repository } = setup();
  const before = repository.getLatestDecisionForRegion("region-pontianak")?.id;
  const internal = service as unknown as { persistLiveInput(input: ReturnType<typeof simulationFixture>): unknown };
  assert.throws(() => internal.persistLiveInput(simulationFixture("HIGH_PONTIANAK")), /SIMULATION tidak boleh/);
  assert.equal(repository.getLatestDecisionForRegion("region-pontianak")?.id, before);
});
