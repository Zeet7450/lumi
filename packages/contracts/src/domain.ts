export const governmentRoles = ["DLH", "BPBD", "DINKES", "DISKOMINFO", "ADMIN_DEMO"] as const;
export const roles = [...governmentRoles, "CITIZEN"] as const;
export type Role = (typeof roles)[number];

export const priorityTiers = ["MONITOR", "VERIFY", "HIGH_RESPONSE"] as const;
export type PriorityTier = (typeof priorityTiers)[number];

export const freshnessValues = ["FRESH", "STALE", "UNAVAILABLE"] as const;
export type Freshness = (typeof freshnessValues)[number];

export const publicationStatuses = [
  "DRAFT",
  "PENDING_APPROVAL",
  "REJECTED",
  "PUBLISHED"
] as const;
export type PublicationStatus = (typeof publicationStatuses)[number];

export const actionIds = [
  "CHECK_FRESHNESS",
  "COORDINATE_FIELD_CHECK",
  "ESCALATE_BPBD",
  "PREPARE_VULNERABLE_GUIDANCE",
  "REVIEW_PUBLIC_COPY"
] as const;
export type ActionId = (typeof actionIds)[number];

export type DataMode = "LIVE" | "SIMULATION";

export type EvidenceKind = "PM25" | "WEATHER" | "WIND" | "HOTSPOT" | "HAZARD";

export const hazardTypes = ["FIRE", "VOLCANIC_ASH", "FLOOD"] as const;
export type HazardType = (typeof hazardTypes)[number];

/** Safe transport shape; it intentionally excludes raw provider payloads. */
export interface Evidence {
  id: string;
  kind: EvidenceKind;
  value: string | number | null;
  unit?: string;
  source: string;
  observedAt: string;
  retrievedAt: string;
  freshness: Freshness;
  mode: DataMode;
  note?: string;
}

export interface ActionCard {
  actionId: ActionId;
  owner: Role;
  text: string;
}

export interface ApiError {
  error: {
    code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "VALIDATION_ERROR"
      | "INTERNAL_ERROR";
    message: string;
    requestId: string;
    fields?: Record<string, string>;
  };
}
