import { randomUUID } from "node:crypto";
import type {
  ActionCard,
  DemoTelemetryInput,
  Freshness,
  PriorityTier,
  Role,
  SimulationPreset
} from "@lumi/contracts";
import { aqiFromPm25, pm25FromAqi } from "@lumi/contracts";
import type {
  BriefInput,
  PublicationDraftInput,
  RejectPublicationInput,
  VersionInput
} from "@lumi/contracts";
import { liveDemoFixtures, simulationFixture } from "../domain/fixtures.js";
import { freshnessAt } from "../domain/normalizer.js";
import { normalizeSnapshot } from "../domain/normalizer.js";
import { publicSourceLabel } from "../domain/public-source.js";
import { demoLocation, demoLocations, type DemoAdministrativeBoundary } from "../domain/demo-locations.js";
import type {
  ActionBrief,
  AuditEvent,
  FreshDecision,
  Incident,
  PriorityDecision,
  PublicNotice,
  PublicProjection,
  RuleInput,
  RuleResult,
  SimulationRun,
  Snapshot,
  User
} from "../domain/model.js";
import { evaluateRulesetV1, POLICY_VERSION } from "../domain/ruleset-v1.js";
import type { GovernmentRepository } from "../repositories/government-repository.js";
import { conflict, forbidden, notFound, unauthenticated } from "./errors.js";
import { hashPassword, newOpaqueToken, tokenHash, verifyPassword } from "./security.js";

export interface Actor {
  userId: string;
  role: Role;
  displayName: string;
  organization: string;
  jobTitle: string;
}

export interface DemoPasswords {
  DLH: string;
  BPBD: string;
  DISKOMINFO: string;
  /** Optional local-demo overrides deliberately fall back to the DLH password. */
  CITIZEN?: string;
  ADMIN_DEMO?: string;
}

/** Safe, non-secret identities shown by the local walkthrough. Passwords stay in environment variables. */
export const demoGovernmentAccounts = [
  {
    id: "user-dlh-operator",
    email: "operator.dlh@demo.lumi.id",
    displayName: "Rani Pratama",
    organization: "Dinas Lingkungan Hidup (DLH)",
    jobTitle: "Operator & Validator Kualitas Udara",
    role: "DLH" as const
  },
  {
    id: "user-bpbd-coordinator",
    email: "koordinator.bpbd@demo.lumi.id",
    displayName: "Bima Santoso",
    organization: "Badan Penanggulangan Bencana Daerah (BPBD)",
    jobTitle: "Koordinator Respons Risiko",
    role: "BPBD" as const
  },
  {
    id: "user-diskominfo-approver",
    email: "approver.diskominfo@demo.lumi.id",
    displayName: "Sari Wulandari",
    organization: "Dinas Komunikasi dan Informatika (Diskominfo)",
    jobTitle: "Approver Informasi Publik",
    role: "DISKOMINFO" as const
  },
  {
    id: "user-demo-simulator",
    email: "simulator@demo.lumi.id",
    displayName: "LUMI Demo",
    organization: "Lingkungan Demonstrasi LUMI",
    jobTitle: "Administrator Simulation Center",
    role: "ADMIN_DEMO" as const
  }
] as const;

/** These local identities exist for a profile/tour only; public information never requires sign-in. */
export const demoCitizenAccounts = [
  {
    id: "user-citizen-amelia",
    email: "amelia.warga@demo.lumi.id",
    displayName: "Amelia Putri",
    organization: "Warga LUMI Demo",
    jobTitle: "Warga",
    role: "CITIZEN" as const
  },
  {
    id: "user-citizen-joko",
    email: "joko.warga@demo.lumi.id",
    displayName: "Joko Pranoto",
    organization: "Warga LUMI Demo",
    jobTitle: "Warga",
    role: "CITIZEN" as const
  },
  {
    id: "user-citizen-nadia",
    email: "nadia.warga@demo.lumi.id",
    displayName: "Nadia Lestari",
    organization: "Warga LUMI Demo",
    jobTitle: "Warga",
    role: "CITIZEN" as const
  }
] as const;

export interface GovernmentServiceOptions {
  now?: () => string;
  sessionHmacKey: string;
}

export class GovernmentService {
  private readonly now: () => string;

  constructor(
    private readonly repository: GovernmentRepository,
    private readonly sessionHmacKey: string,
    options: Pick<GovernmentServiceOptions, "now"> = {}
  ) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  seedDemo(passwords: DemoPasswords): void {
    this.repository.transaction(() => {
      for (const account of demoGovernmentAccounts) {
        const password = account.role === "ADMIN_DEMO"
          ? (passwords.ADMIN_DEMO ?? passwords.DLH)
          : passwords[account.role];
        const existing = this.repository.getUserByEmail(account.email);
        if (!existing) {
          this.repository.upsertUser({ ...account, passwordHash: hashPassword(password) });
        }
      }
      for (const account of demoCitizenAccounts) {
        const existing = this.repository.getUserByEmail(account.email);
        if (!existing) {
          this.repository.upsertUser({ ...account, passwordHash: hashPassword(passwords.CITIZEN ?? passwords.DLH) });
        }
      }
      for (const input of liveDemoFixtures(this.now())) this.persistLiveInput(input);
    });
  }

  login(email: string, password: string): { token: string; actor: Actor; expiresAt: string } {
    const user = this.repository.getUserByEmail(email.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) throw unauthenticated();
    const token = newOpaqueToken();
    const expiresAt = new Date(new Date(this.now()).getTime() + 8 * 60 * 60_000).toISOString();
    this.repository.saveSession({ tokenHash: tokenHash(token, this.sessionHmacKey), userId: user.id, expiresAt });
    return { token, actor: this.actorForUser(user), expiresAt };
  }

  authenticate(token: string | undefined): Actor {
    return this.session(token).actor;
  }

  session(token: string | undefined): { actor: Actor; expiresAt: string } {
    if (!token) throw unauthenticated();
    const session = this.repository.getSession(tokenHash(token, this.sessionHmacKey));
    if (!session || new Date(session.expiresAt).getTime() <= new Date(this.now()).getTime()) throw unauthenticated();
    const user = this.repository.getUserById(session.userId);
    if (!user) throw unauthenticated();
    return { actor: this.actorForUser(user), expiresAt: session.expiresAt };
  }

  logout(token: string | undefined): void {
    if (token) this.repository.deleteSession(tokenHash(token, this.sessionHmacKey));
  }

  listIncidents(actor: Actor, filters: { tier?: PriorityTier; region?: string; status?: "OPEN" } = {}): unknown[] {
    this.assertReader(actor);
    return this.repository.listIncidents()
      .map((incident) => this.incidentSummary(incident))
      .filter((item) => this.canReadIncident(actor, item.tier))
      .filter((item) => item.workflowStatus === (filters.status ?? "OPEN"))
      .filter((item) => !filters.tier || item.tier === filters.tier)
      .filter((item) => !filters.region || item.region.slug === filters.region)
      .sort((a, b) => priorityRank(b.tier) - priorityRank(a.tier));
  }

  getIncident(actor: Actor, incidentId: string): unknown {
    this.assertReader(actor);
    const incident = this.requireIncident(incidentId);
    const decision = this.requireDecision(incident.decisionId);
    if (!this.canReadIncident(actor, decision.tier)) throw forbidden();
    const region = this.repository.getRegionById(incident.regionId);
    if (!region) throw notFound();
    const brief = this.repository.getBriefForIncident(incident.id);
    const notice = this.repository.getLatestNoticeForIncident(incident.id);
    return {
      id: incident.id,
      region,
      workflowStatus: incident.workflowStatus,
      dataVersion: incident.dataVersion,
      decision: {
        tier: decision.tier,
        rationale: decision.rationale,
        dataGaps: decision.dataGaps,
        ownerHints: decision.ownerHints,
        policyVersion: decision.policyVersion,
        decidedAt: decision.decidedAt
      },
      evidence: this.currentSnapshots(this.repository.getSnapshots(decision.evidenceIds)),
      actionBrief: brief,
      publication: notice ? this.serializeOpsNotice(notice) : null
    };
  }

  updateBrief(actor: Actor, incidentId: string, input: BriefInput): ActionBrief {
    this.requireRole(actor, "DLH");
    return this.repository.transaction(() => {
      const brief = this.repository.getBriefForIncident(incidentId);
      if (!brief) throw notFound();
      if (brief.revision !== input.expectedRevision) throw conflict();
      const updated: ActionBrief = {
        ...brief,
        actions: input.actions,
        reviewNote: input.reviewNote,
        revision: brief.revision + 1,
        updatedAt: this.now()
      };
      this.repository.saveBrief(updated);
      this.audit(actor, "ACTION_BRIEF_UPDATED", "ACTION_BRIEF", brief.id, { revision: brief.revision }, { revision: updated.revision });
      return updated;
    });
  }

  savePublicationDraft(actor: Actor, incidentId: string, input: PublicationDraftInput): PublicNotice {
    this.requireRole(actor, "DLH");
    return this.repository.transaction(() => {
      const incident = this.requireIncident(incidentId);
      const latest = this.repository.getLatestNoticeForIncident(incidentId);
      const now = this.now();
      let next: PublicNotice;
      if (!latest || latest.status === "PUBLISHED") {
        if (input.expectedRevision !== 1) throw conflict();
        next = {
          id: `notice-${randomUUID()}`,
          incidentId,
          decisionId: incident.decisionId,
          regionId: incident.regionId,
          text: input.text,
          status: "DRAFT",
          revision: 1,
          supersedesNoticeId: latest?.id,
          createdAt: now,
          updatedAt: now
        };
      } else {
        if (latest.revision !== input.expectedRevision || latest.status === "PENDING_APPROVAL") throw conflict();
        next = {
          ...latest,
          decisionId: incident.decisionId,
          text: input.text,
          status: "DRAFT",
          rejectionNote: undefined,
          revision: latest.revision + 1,
          updatedAt: now
        };
      }
      this.repository.saveNotice(next);
      this.audit(actor, "PUBLICATION_DRAFT_SAVED", "PUBLIC_NOTICE", next.id, latest ? { status: latest.status, revision: latest.revision } : undefined, { status: next.status, revision: next.revision });
      return next;
    });
  }

  submitPublication(actor: Actor, incidentId: string, input: VersionInput): PublicNotice {
    this.requireRole(actor, "DLH");
    return this.repository.transaction(() => {
      const notice = this.repository.getLatestNoticeForIncident(incidentId);
      if (!notice) throw notFound();
      if ((notice.status !== "DRAFT" && notice.status !== "REJECTED") || notice.revision !== input.expectedRevision) throw conflict();
      if (notice.decisionId !== this.requireIncident(incidentId).decisionId) throw conflict();
      const updated: PublicNotice = {
        ...notice,
        status: "PENDING_APPROVAL",
        submittedBy: actor.userId,
        rejectionNote: undefined,
        revision: notice.revision + 1,
        updatedAt: this.now()
      };
      this.repository.saveNotice(updated);
      this.audit(actor, "PUBLICATION_SUBMITTED", "PUBLIC_NOTICE", updated.id, { status: notice.status, revision: notice.revision }, { status: updated.status, revision: updated.revision });
      return updated;
    });
  }

  approvePublication(actor: Actor, noticeId: string, input: VersionInput): PublicNotice {
    this.requireRole(actor, "DISKOMINFO");
    return this.repository.transaction(() => {
      const notice = this.requireNotice(noticeId);
      if (notice.status !== "PENDING_APPROVAL" || notice.revision !== input.expectedRevision) throw conflict();
      if (notice.decisionId !== this.requireIncident(notice.incidentId).decisionId) throw conflict();
      const prior = this.repository.getActivePublishedNoticeForRegion(notice.regionId);
      const now = this.now();
      if (prior) this.repository.saveNotice({ ...prior, supersededAt: now, updatedAt: now });
      const published: PublicNotice = {
        ...notice,
        status: "PUBLISHED",
        approvedBy: actor.userId,
        approvedAt: now,
        publishedAt: now,
        revision: notice.revision + 1,
        updatedAt: now
      };
      this.repository.saveNotice(published);
      this.audit(actor, "PUBLICATION_APPROVED", "PUBLIC_NOTICE", published.id, { status: notice.status, revision: notice.revision }, { status: published.status, revision: published.revision });
      return published;
    });
  }

  rejectPublication(actor: Actor, noticeId: string, input: RejectPublicationInput): PublicNotice {
    this.requireRole(actor, "DISKOMINFO");
    return this.repository.transaction(() => {
      const notice = this.requireNotice(noticeId);
      if (notice.status !== "PENDING_APPROVAL" || notice.revision !== input.expectedRevision) throw conflict();
      const rejected: PublicNotice = {
        ...notice,
        status: "REJECTED",
        rejectionNote: input.rejectionNote,
        revision: notice.revision + 1,
        updatedAt: this.now()
      };
      this.repository.saveNotice(rejected);
      this.audit(actor, "PUBLICATION_REJECTED", "PUBLIC_NOTICE", rejected.id, { status: notice.status, revision: notice.revision }, { status: rejected.status, revision: rejected.revision });
      return rejected;
    });
  }

  runSimulation(actor: Actor, preset: SimulationPreset): SimulationRun {
    this.requireRole(actor, "ADMIN_DEMO");
    const input = simulationFixture(preset);
    const output = evaluateRulesetV1(input);
    const run: SimulationRun = {
      id: `simulation-${randomUUID()}`,
      preset,
      regionId: input.region.id,
      input,
      output,
      policyVersion: POLICY_VERSION,
      createdAt: this.now(),
      mode: "SIMULATION"
    };
    this.repository.saveSimulation(run);
    this.audit(actor, "SIMULATION_RUN", "SIMULATION", run.id, undefined, { preset, mode: run.mode });
    return run;
  }

  getSimulation(actor: Actor, runId: string): SimulationRun {
    this.requireRole(actor, "ADMIN_DEMO");
    const run = this.repository.getSimulation(runId);
    if (!run) throw notFound();
    return run;
  }

  refreshFixtures(actor: Actor): { refreshedAt: string; decisionsCreated: number } {
    this.requireRole(actor, "ADMIN_DEMO");
    return this.repository.transaction(() => {
      let decisionsCreated = 0;
      for (const input of liveDemoFixtures(this.now())) {
        const result = this.persistLiveInput(input);
        if (result.kind === "DECISION") decisionsCreated += 1;
      }
      const refreshedAt = this.now();
      this.audit(actor, "FIXTURES_REFRESHED", "FIXTURE", "live-demo-fixtures", undefined, { decisionsCreated });
      return { refreshedAt, decisionsCreated };
    });
  }

  /**
   * The only writable LIVE-data demo seam. It is role-gated and accepts a
   * compact validated payload rather than arbitrary provider-shaped JSON.
   */
  ingestDemoTelemetry(actor: Actor, telemetry: DemoTelemetryInput): { id: string; receivedAt: string; status: "ACCEPTED" } {
    this.requireRole(actor, "ADMIN_DEMO");
    const location = demoLocation(telemetry.locationId);
    const region = this.repository.listRegions().find((item) => item.slug === location.regionSlug);
    if (!region) throw notFound();
    const now = this.now();
    const pm25 = pm25FromAqi(telemetry.aqi);
    const snapshots: Snapshot[] = [
      normalizeSnapshot({
        id: `demo-${region.slug}-pm25-${randomUUID()}`,
        regionId: region.id,
        kind: "PM25",
        value: pm25,
        unit: "ug/m3",
        source: "LUMI Demo Stream",
        observedAt: now,
        retrievedAt: now,
        mode: "LIVE",
        pm25Source: "STATION",
        locationId: location.id, latitude: location.latitude, longitude: location.longitude, impactRadiusKm: 8
      }, now)
    ];
    for (const hazard of telemetry.hazards) {
      const labels = { FIRE: "indikasi kebakaran", VOLCANIC_ASH: "indikasi abu vulkanik", FLOOD: "indikasi banjir" } as const;
      snapshots.push(normalizeSnapshot({
        id: `demo-${region.slug}-hazard-${hazard.type.toLowerCase()}-${randomUUID()}`,
        regionId: region.id,
        kind: "HAZARD",
        value: hazard.severity,
        source: "LUMI Demo Stream",
        observedAt: now,
        retrievedAt: now,
        mode: "LIVE",
        hazardType: hazard.type,
        note: `${labels[hazard.type]} tingkat ${hazard.severity}; memerlukan verifikasi petugas.`,
        locationId: location.id, latitude: location.latitude, longitude: location.longitude, impactRadiusKm: 8
      }, now));
    }
    const result = this.repository.transaction(() => this.persistLiveInput({ region, mode: "LIVE", snapshots, now }));
    const deliveryId = `delivery-${randomUUID()}`;
    this.audit(actor, "DEMO_TELEMETRY_INGESTED", "FIXTURE", deliveryId, undefined, {
      locationId: location.id,
      locationName: location.name,
      aqi: telemetry.aqi,
      hazards: telemetry.hazards,
      status: "ACCEPTED"
    });
    // The simulator receives a delivery receipt only; priority remains an Ops-only decision.
    void result;
    return { id: deliveryId, receivedAt: now, status: "ACCEPTED" };
  }

  listDemoTelemetryHistory(actor: Actor, limit = 8): Array<{ id: string; receivedAt: string; locationName: string; aqi: number; status: "ACCEPTED" }> {
    this.requireRole(actor, "ADMIN_DEMO");
    return this.repository.listAudit()
      .filter((event) => event.action === "DEMO_TELEMETRY_INGESTED" && event.actorId === actor.userId)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .slice(0, Math.min(Math.max(limit, 1), 20))
      .flatMap((event) => {
        const after = event.after;
        if (!after || typeof after.locationName !== "string" || typeof after.aqi !== "number") return [];
        return [{ id: event.entityId, receivedAt: event.occurredAt, locationName: after.locationName, aqi: after.aqi, status: "ACCEPTED" as const }];
      });
  }

  listSimulatorLocations(actor: Actor): Array<{ id: string; provinceSlug: string; province: string; name: string; city: string }> {
    this.requireRole(actor, "ADMIN_DEMO");
    return demoLocations.map(({ id, provinceSlug, province, name, city }) => ({ id, provinceSlug, province, name, city }));
  }

  dashboard(actor: Actor): {
    updatedAt: string | null;
    kpis: { monitoredRegions: number; highResponse: number; verification: number; openIncidents: number };
    regions: Array<{ slug: string; name: string; province: string; pm25: number | null; aqi: number | null; tier: PriorityTier | null; freshness: Freshness; observedAt: string | null }>;
    trend: Array<{ observedAt: string; pm25: number; regionSlug: string }>;
    mapPoints: Array<{ id: string; name: string; provinceSlug: string; province: string; city: string; district: string; village: string; latitude: number; longitude: number; radiusKm: number; pm25: number | null; aqi: number | null; tier: PriorityTier | null; observedAt: string | null; hazards: Array<{ type: string; severity: number }>; administrativeBoundary: DemoAdministrativeBoundary | null; boundaryStatus: "UNAVAILABLE" }>;
  } {
    this.assertReader(actor);
    const regions = this.repository.listRegions().map((region) => {
      const snapshots = this.currentSnapshots(this.repository.getLatestSnapshotsForRegion(region.id));
      const latestPm25 = snapshots.filter((snapshot) => snapshot.kind === "PM25" && typeof snapshot.value === "number").at(-1);
      const decision = this.repository.getLatestDecisionForRegion(region.id);
      return {
        slug: region.slug,
        name: region.name,
        province: region.province,
        pm25: typeof latestPm25?.value === "number" ? latestPm25.value : null,
        aqi: typeof latestPm25?.value === "number" ? aqiFromPm25(latestPm25.value).aqi : null,
        tier: decision?.tier ?? null,
        freshness: this.currentEvidenceForRegion(region.id).freshness,
        observedAt: latestPm25?.observedAt ?? null
      };
    });
    const open = this.repository.listIncidents().filter((incident) => incident.workflowStatus === "OPEN");
    const trend = this.repository.listRegions().flatMap((region) =>
      this.repository.listSnapshotsForRegion(region.id, "PM25")
        .filter((snapshot): snapshot is Snapshot & { value: number } => typeof snapshot.value === "number")
        .slice(-12)
        .map((snapshot) => ({ observedAt: snapshot.observedAt, pm25: snapshot.value, regionSlug: region.slug }))
    ).sort((a, b) => a.observedAt.localeCompare(b.observedAt)).slice(-24);
    const regionsBySlug = new Map(this.repository.listRegions().map((region) => [region.slug, region]));
    const mapPoints = demoLocations.map((location) => {
      const region = regionsBySlug.get(location.regionSlug);
      if (!region) throw new Error(`Wilayah ${location.regionSlug} tidak tersedia.`);
      const latestPm25 = this.currentSnapshots(this.repository.getLatestSnapshotsForRegion(region.id))
        .filter((snapshot): snapshot is Snapshot & { value: number } => snapshot.kind === "PM25" && typeof snapshot.value === "number")
        .at(-1);
      const decision = this.repository.getLatestDecisionForRegion(region.id);
      const hazards = this.currentSnapshots(this.repository.getLatestSnapshotsForRegion(region.id))
        .filter((snapshot): snapshot is Snapshot & { value: number } => snapshot.kind === "HAZARD" && typeof snapshot.value === "number")
        .map((snapshot) => ({ type: snapshot.hazardType ?? "UNKNOWN", severity: snapshot.value }));
      return { id: location.id, name: location.name, provinceSlug: location.provinceSlug, province: location.province, city: location.city, district: location.district, village: location.village, latitude: location.latitude, longitude: location.longitude, radiusKm: latestPm25?.impactRadiusKm ?? 8, pm25: latestPm25?.value ?? null, aqi: typeof latestPm25?.value === "number" ? aqiFromPm25(latestPm25.value).aqi : null, tier: decision?.tier ?? null, observedAt: latestPm25?.observedAt ?? null, hazards, administrativeBoundary: null, boundaryStatus: "UNAVAILABLE" as const };
    });
    return {
      updatedAt: regions.map((region) => region.observedAt).filter((value): value is string => !!value).sort().at(-1) ?? null,
      kpis: {
        monitoredRegions: regions.length,
        highResponse: regions.filter((region) => region.tier === "HIGH_RESPONSE").length,
        verification: regions.filter((region) => region.tier === "VERIFY").length,
        openIncidents: open.length
      },
      regions,
      trend,
      mapPoints
    };
  }

  /** This serializer is the public-contract boundary; the public API is built later. */
  publicProjectionForRegion(regionId: string): PublicProjection | null {
    const notice = this.repository.getActivePublishedNoticeForRegion(regionId);
    if (!notice) return null;
    const decision = this.requireDecision(notice.decisionId);
    const region = this.repository.getRegionById(regionId);
    if (!region) return null;
    const currentEvidence = this.currentEvidenceForRegion(regionId);
    return {
      region: { slug: region.slug, name: region.name, province: region.province },
      notice: {
        tier: decision.tier,
        text: notice.text,
        publishedAt: notice.publishedAt ?? notice.updatedAt,
        dataObservedAt: currentEvidence.dataObservedAt ?? null,
        currentFreshness: currentEvidence.freshness,
        sources: currentEvidence.sources
      }
    };
  }

  publicProjectionForRegionSlug(slug: string): PublicProjection | null {
    const region = this.repository.listRegions().find((item) => item.slug === slug);
    if (!region) throw notFound();
    return this.publicProjectionForRegion(region.id);
  }

  listAuditForTest(): AuditEvent[] { return this.repository.listAudit(); }

  private persistLiveInput(input: RuleInput): RuleResult {
    if (input.mode !== "LIVE" || input.snapshots.some((snapshot) => snapshot.mode !== "LIVE")) {
      throw new Error("Input SIMULATION tidak boleh memasuki jalur data live.");
    }
    const liveInput: RuleInput = {
      ...input,
      // Source identifiers may repeat across polling runs. Stored evidence IDs
      // must not, otherwise a later refresh can rewrite an earlier decision.
      snapshots: input.snapshots.map((snapshot) => ({ ...snapshot, id: `${snapshot.id}-${randomUUID()}` }))
    };
    this.repository.saveSnapshots(liveInput.snapshots);
    const result = evaluateRulesetV1(liveInput);
    if (result.kind !== "DECISION") return result;
    const decision: PriorityDecision = {
      id: `decision-${liveInput.region.id}-${randomUUID()}`,
      regionId: liveInput.region.id,
      tier: result.tier,
      rationale: result.rationale,
      evidenceIds: result.evidenceIds,
      dataGaps: result.dataGaps,
      ownerHints: result.ownerHints,
      policyVersion: POLICY_VERSION,
      decidedAt: this.now(),
      mode: "LIVE"
    };
    this.repository.saveDecision(decision);
    const currentIncident = this.repository.listIncidents().find((incident) => incident.regionId === liveInput.region.id && incident.workflowStatus === "OPEN");
    if (result.tier !== "MONITOR" && !currentIncident) {
      const incident: Incident = {
        id: `incident-${liveInput.region.slug}-${randomUUID()}`,
        regionId: liveInput.region.id,
        decisionId: decision.id,
        workflowStatus: "OPEN",
        dataVersion: 1,
        updatedAt: this.now()
      };
      this.repository.saveIncident(incident);
      this.repository.saveBrief(defaultBrief(incident.id, result, this.now()));
    }
    if (result.tier !== "MONITOR" && currentIncident) {
      this.repository.saveIncident({
        ...currentIncident,
        decisionId: decision.id,
        dataVersion: currentIncident.dataVersion + 1,
        updatedAt: this.now()
      });
    }
    if (result.tier === "MONITOR" && currentIncident) {
      this.repository.saveIncident({
        ...currentIncident,
        decisionId: decision.id,
        workflowStatus: "RESOLVED",
        dataVersion: currentIncident.dataVersion + 1,
        updatedAt: this.now()
      });
    }
    return result;
  }

  private incidentSummary(incident: Incident): { id: string; region: { slug: string; name: string; province: string }; tier: PriorityTier; workflowStatus: Incident["workflowStatus"]; rationale: string[]; freshness: Freshness } {
    const decision = this.requireDecision(incident.decisionId);
    const region = this.repository.getRegionById(incident.regionId);
    if (!region) throw notFound();
    return {
      id: incident.id,
      region,
      tier: decision.tier,
      workflowStatus: incident.workflowStatus,
      rationale: decision.rationale,
      freshness: this.currentEvidenceForRegion(incident.regionId).freshness
    };
  }

  private currentEvidenceForRegion(regionId: string): { freshness: Freshness; dataObservedAt?: string; sources: string[] } {
    const snapshots = this.currentSnapshots(this.repository.getLatestSnapshotsForRegion(regionId));
    const freshness: Freshness = snapshots.some((snapshot) => snapshot.freshness === "STALE") ? "STALE" :
      snapshots.length > 0 && snapshots.every((snapshot) => snapshot.freshness === "FRESH") ? "FRESH" : "UNAVAILABLE";
    return {
      freshness,
      dataObservedAt: snapshots.map((snapshot) => snapshot.observedAt).sort().at(-1),
      sources: [...new Set(snapshots.map((snapshot) => publicSourceLabel(snapshot.source)))]
    };
  }

  private currentSnapshots(snapshots: Snapshot[]): Snapshot[] {
    return snapshots.map((snapshot) => {
      if (snapshot.freshness === "UNAVAILABLE") return snapshot;
      const current = freshnessAt(snapshot, this.now());
      return {
        ...snapshot,
        freshness: snapshot.freshness === "STALE" && current === "FRESH" ? "STALE" : current
      };
    });
  }

  private canReadIncident(actor: Actor, tier: PriorityTier): boolean {
    return actor.role === "DLH" || actor.role === "DISKOMINFO" || ((actor.role === "BPBD" || actor.role === "DINKES") && tier === "HIGH_RESPONSE");
  }
  private assertReader(actor: Actor): void { if (!["DLH", "BPBD", "DINKES", "DISKOMINFO"].includes(actor.role)) throw forbidden(); }
  private requireRole(actor: Actor, role: Role): void { if (actor.role !== role) throw forbidden(); }
  private requireIncident(id: string): Incident { const value = this.repository.getIncident(id); if (!value) throw notFound(); return value; }
  private requireDecision(id: string): PriorityDecision { const value = this.repository.getDecision(id); if (!value) throw notFound(); return value; }
  private requireNotice(id: string): PublicNotice { const value = this.repository.getNotice(id); if (!value) throw notFound(); return value; }
  private actorForUser(user: User): Actor {
    return {
      userId: user.id,
      role: user.role,
      displayName: user.displayName,
      organization: user.organization,
      jobTitle: user.jobTitle
    };
  }
  private serializeOpsNotice(notice: PublicNotice): Omit<PublicNotice, "supersededAt"> { const { supersededAt: _, ...safe } = notice; return safe; }
  private audit(actor: Actor, action: string, entity: AuditEvent["entity"], entityId: string, before?: Record<string, unknown>, after?: Record<string, unknown>): void {
    this.repository.saveAudit({ id: `audit-${randomUUID()}`, actorId: actor.userId, actorRole: actor.role, action, entity, entityId, occurredAt: this.now(), before, after });
  }
}

function defaultBrief(incidentId: string, result: FreshDecision, now: string): ActionBrief {
  const actions: ActionCard[] = [
    { actionId: "CHECK_FRESHNESS", owner: "DLH", text: "Cek kesegaran data dan koordinasikan pemeriksaan." },
    { actionId: "PREPARE_VULNERABLE_GUIDANCE", owner: "DINKES", text: "Siapkan panduan untuk kelompok rentan." },
    { actionId: "REVIEW_PUBLIC_COPY", owner: "DISKOMINFO", text: "Tinjau kejelasan draf informasi publik." }
  ];
  if (result.tier === "HIGH_RESPONSE") actions.splice(1, 0, { actionId: "ESCALATE_BPBD", owner: "BPBD", text: "Koordinasikan eskalasi respons demo." });
  return { id: `brief-${randomUUID()}`, incidentId, actions, reviewNote: "", status: "DRAFT", revision: 1, updatedAt: now };
}

function priorityRank(tier: PriorityTier): number {
  return tier === "HIGH_RESPONSE" ? 3 : tier === "VERIFY" ? 2 : 1;
}
