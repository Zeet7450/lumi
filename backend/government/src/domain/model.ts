import type {
  ActionCard,
  DataMode,
  Evidence,
  Freshness,
  PriorityTier,
  PublicationStatus,
  Role
} from "@lumi/contracts";

export interface Region {
  id: string;
  slug: string;
  name: string;
  province: string;
}

export interface Snapshot extends Evidence {
  regionId: string;
  pm25Source?: "STATION" | "MODEL";
  windSupportsImpact?: boolean;
  hotspotDistanceKm?: number;
  locationId?: string;
  latitude?: number;
  longitude?: number;
  impactRadiusKm?: number;
  hazardType?: import("@lumi/contracts").HazardType;
}

export interface RuleInput {
  region: Region;
  mode: DataMode;
  snapshots: Snapshot[];
  now: string;
}

export interface PriorityDecision {
  id: string;
  regionId: string;
  tier: PriorityTier;
  rationale: string[];
  evidenceIds: string[];
  dataGaps: string[];
  ownerHints: Role[];
  policyVersion: "ruleset-v1";
  decidedAt: string;
  mode: "LIVE";
}

export interface NoFreshDecision {
  kind: "NO_FRESH_DECISION";
  freshness: Exclude<Freshness, "FRESH">;
  dataGaps: string[];
  evidenceIds: string[];
  policyVersion: "ruleset-v1";
}

export interface FreshDecision {
  kind: "DECISION";
  tier: PriorityTier;
  rationale: string[];
  evidenceIds: string[];
  dataGaps: string[];
  ownerHints: Role[];
  policyVersion: "ruleset-v1";
}

export type RuleResult = FreshDecision | NoFreshDecision;

export interface Incident {
  id: string;
  regionId: string;
  decisionId: string;
  workflowStatus: "OPEN" | "RESOLVED";
  dataVersion: number;
  updatedAt: string;
}

export interface ActionBrief {
  id: string;
  incidentId: string;
  actions: ActionCard[];
  reviewNote: string;
  status: "DRAFT";
  revision: number;
  updatedAt: string;
}

export interface PublicNotice {
  id: string;
  incidentId: string;
  /** Decision reviewed by Diskominfo when this notice is approved. */
  decisionId: string;
  regionId: string;
  text: string;
  status: PublicationStatus;
  revision: number;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionNote?: string;
  publishedAt?: string;
  supersededAt?: string;
  supersedesNoticeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: Role;
  action: string;
  entity: "ACTION_BRIEF" | "PUBLIC_NOTICE" | "SIMULATION" | "FIXTURE";
  entityId: string;
  occurredAt: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  organization: string;
  jobTitle: string;
  role: Role;
  passwordHash: string;
}

export interface Session {
  tokenHash: string;
  userId: string;
  expiresAt: string;
}

export interface SimulationRun {
  id: string;
  preset: "MONITOR" | "VERIFY" | "HIGH_PONTIANAK" | "STALE";
  regionId: string;
  input: RuleInput;
  output: RuleResult;
  policyVersion: "ruleset-v1";
  createdAt: string;
  mode: "SIMULATION";
}

export interface PublicProjection {
  region: Pick<Region, "slug" | "name" | "province">;
  notice: {
    tier: PriorityTier;
    text: string;
    publishedAt: string;
    /** Null means no current observation is available; never substitute publication time. */
    dataObservedAt: string | null;
    currentFreshness: Freshness;
    sources: string[];
  };
}
