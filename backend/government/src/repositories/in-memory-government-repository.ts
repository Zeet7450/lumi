import type {
  ActionBrief,
  AuditEvent,
  Incident,
  PriorityDecision,
  PublicNotice,
  Region,
  Session,
  SimulationRun,
  Snapshot,
  User
} from "../domain/model.js";
import type { GovernmentRepository } from "./government-repository.js";

function copy<T>(value: T): T {
  return structuredClone(value);
}

/** Offline fixture repository used by tests and the local demo server. */
export class InMemoryGovernmentRepository implements GovernmentRepository {
  private readonly regions = new Map<string, Region>();
  private readonly users = new Map<string, User>();
  private readonly usersByEmail = new Map<string, string>();
  private readonly sessions = new Map<string, Session>();
  private readonly snapshots = new Map<string, Snapshot>();
  private readonly snapshotIdsByRegion = new Map<string, string[]>();
  private readonly latestSnapshotIdsByRegion = new Map<string, string[]>();
  private readonly decisions = new Map<string, PriorityDecision>();
  private readonly decisionIdsByRegion = new Map<string, string[]>();
  private readonly incidents = new Map<string, Incident>();
  private readonly briefsByIncident = new Map<string, ActionBrief>();
  private readonly notices = new Map<string, PublicNotice>();
  private readonly noticeIdsByIncident = new Map<string, string[]>();
  private readonly audits: AuditEvent[] = [];
  private readonly simulations = new Map<string, SimulationRun>();

  constructor(regions: Region[]) {
    for (const region of regions) this.regions.set(region.id, copy(region));
  }

  transaction<T>(operation: () => T): T {
    // State changes are synchronous; a mutation completes before another HTTP handler can observe it.
    return operation();
  }

  listRegions(): Region[] { return [...this.regions.values()].map(copy); }
  getRegionById(id: string): Region | undefined { return this.regions.get(id) && copy(this.regions.get(id)!); }
  getUserByEmail(email: string): User | undefined {
    const id = this.usersByEmail.get(email);
    return id ? this.getUserById(id) : undefined;
  }
  getUserById(id: string): User | undefined { return this.users.get(id) && copy(this.users.get(id)!); }
  upsertUser(user: User): void {
    this.users.set(user.id, copy(user));
    this.usersByEmail.set(user.email, user.id);
  }
  saveSession(session: Session): void { this.sessions.set(session.tokenHash, copy(session)); }
  getSession(tokenHash: string): Session | undefined { return this.sessions.get(tokenHash) && copy(this.sessions.get(tokenHash)!); }
  deleteSession(tokenHash: string): void { this.sessions.delete(tokenHash); }

  saveSnapshots(snapshots: Snapshot[]): void {
    const latestIdsByRegion = new Map<string, string[]>();
    for (const snapshot of snapshots) {
      this.snapshots.set(snapshot.id, copy(snapshot));
      const ids = this.snapshotIdsByRegion.get(snapshot.regionId) ?? [];
      if (!ids.includes(snapshot.id)) ids.push(snapshot.id);
      this.snapshotIdsByRegion.set(snapshot.regionId, ids);
      const latestIds = latestIdsByRegion.get(snapshot.regionId) ?? [];
      if (!latestIds.includes(snapshot.id)) latestIds.push(snapshot.id);
      latestIdsByRegion.set(snapshot.regionId, latestIds);
    }
    for (const [regionId, ids] of latestIdsByRegion) this.latestSnapshotIdsByRegion.set(regionId, ids);
  }
  getSnapshots(ids: string[]): Snapshot[] { return ids.flatMap((id) => this.snapshots.has(id) ? [copy(this.snapshots.get(id)!)] : []); }
  getLatestSnapshotsForRegion(regionId: string): Snapshot[] {
    return this.getSnapshots(this.latestSnapshotIdsByRegion.get(regionId) ?? []);
  }
  listSnapshotsForRegion(regionId: string, kind?: Snapshot["kind"]): Snapshot[] {
    return this.getSnapshots(this.snapshotIdsByRegion.get(regionId) ?? [])
      .filter((snapshot) => !kind || snapshot.kind === kind)
      .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  }

  saveDecision(decision: PriorityDecision): void {
    this.decisions.set(decision.id, copy(decision));
    const ids = this.decisionIdsByRegion.get(decision.regionId) ?? [];
    if (!ids.includes(decision.id)) ids.push(decision.id);
    this.decisionIdsByRegion.set(decision.regionId, ids);
  }
  getDecision(id: string): PriorityDecision | undefined { return this.decisions.get(id) && copy(this.decisions.get(id)!); }
  getLatestDecisionForRegion(regionId: string): PriorityDecision | undefined {
    const ids = this.decisionIdsByRegion.get(regionId) ?? [];
    return ids.length ? this.getDecision(ids.at(-1)!) : undefined;
  }

  saveIncident(incident: Incident): void { this.incidents.set(incident.id, copy(incident)); }
  getIncident(id: string): Incident | undefined { return this.incidents.get(id) && copy(this.incidents.get(id)!); }
  listIncidents(): Incident[] { return [...this.incidents.values()].map(copy); }
  saveBrief(brief: ActionBrief): void { this.briefsByIncident.set(brief.incidentId, copy(brief)); }
  getBriefForIncident(incidentId: string): ActionBrief | undefined {
    return this.briefsByIncident.get(incidentId) && copy(this.briefsByIncident.get(incidentId)!);
  }

  saveNotice(notice: PublicNotice): void {
    this.notices.set(notice.id, copy(notice));
    const ids = this.noticeIdsByIncident.get(notice.incidentId) ?? [];
    if (!ids.includes(notice.id)) ids.push(notice.id);
    this.noticeIdsByIncident.set(notice.incidentId, ids);
  }
  getNotice(id: string): PublicNotice | undefined { return this.notices.get(id) && copy(this.notices.get(id)!); }
  getLatestNoticeForIncident(incidentId: string): PublicNotice | undefined {
    const ids = this.noticeIdsByIncident.get(incidentId) ?? [];
    return ids.length ? this.getNotice(ids.at(-1)!) : undefined;
  }
  getActivePublishedNoticeForRegion(regionId: string): PublicNotice | undefined {
    return [...this.notices.values()]
      .filter((notice) => notice.regionId === regionId && notice.status === "PUBLISHED" && !notice.supersededAt)
      .map(copy)
      .at(0);
  }

  saveAudit(event: AuditEvent): void { this.audits.push(copy(event)); }
  listAudit(): AuditEvent[] { return this.audits.map(copy); }
  saveSimulation(run: SimulationRun): void { this.simulations.set(run.id, copy(run)); }
  getSimulation(id: string): SimulationRun | undefined { return this.simulations.get(id) && copy(this.simulations.get(id)!); }
}
