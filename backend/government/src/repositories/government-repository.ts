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

/**
 * The application depends on this boundary, never on a Supabase REST client.
 * The production adapter will use a TLS PostgreSQL connection injected at runtime.
 */
export interface GovernmentRepository {
  transaction<T>(operation: () => T): T;
  listRegions(): Region[];
  getRegionById(id: string): Region | undefined;
  getUserByEmail(email: string): User | undefined;
  getUserById(id: string): User | undefined;
  upsertUser(user: User): void;
  saveSession(session: Session): void;
  getSession(tokenHash: string): Session | undefined;
  deleteSession(tokenHash: string): void;
  saveSnapshots(snapshots: Snapshot[]): void;
  getSnapshots(ids: string[]): Snapshot[];
  getLatestSnapshotsForRegion(regionId: string): Snapshot[];
  listSnapshotsForRegion(regionId: string, kind?: Snapshot["kind"]): Snapshot[];
  saveDecision(decision: PriorityDecision): void;
  getDecision(id: string): PriorityDecision | undefined;
  getLatestDecisionForRegion(regionId: string): PriorityDecision | undefined;
  saveIncident(incident: Incident): void;
  getIncident(id: string): Incident | undefined;
  listIncidents(): Incident[];
  saveBrief(brief: ActionBrief): void;
  getBriefForIncident(incidentId: string): ActionBrief | undefined;
  saveNotice(notice: PublicNotice): void;
  getNotice(id: string): PublicNotice | undefined;
  getLatestNoticeForIncident(incidentId: string): PublicNotice | undefined;
  getActivePublishedNoticeForRegion(regionId: string): PublicNotice | undefined;
  saveAudit(event: AuditEvent): void;
  listAudit(): AuditEvent[];
  saveSimulation(run: SimulationRun): void;
  getSimulation(id: string): SimulationRun | undefined;
}
