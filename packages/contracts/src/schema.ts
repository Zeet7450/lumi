import { actionIds, governmentRoles, hazardTypes, type ActionCard, type ActionId, type HazardType } from "./domain.js";

export class ContractValidationError extends Error {
  readonly fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super("Input tidak valid.");
    this.name = "ContractValidationError";
    this.fields = fields;
  }
}

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ContractValidationError({ body: "Payload harus berupa objek JSON." });
  }
  return value as JsonObject;
}

function text(
  value: unknown,
  field: string,
  options: { min: number; max: number; pattern?: RegExp }
): string {
  if (typeof value !== "string" || value.length < options.min || value.length > options.max) {
    throw new ContractValidationError({ [field]: `Panjang ${field} tidak valid.` });
  }
  if (options.pattern && !options.pattern.test(value)) {
    throw new ContractValidationError({ [field]: `Format ${field} tidak valid.` });
  }
  return value;
}

function revision(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new ContractValidationError({ expectedRevision: "Versi record wajib berupa bilangan positif." });
  }
  return value;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function parseLoginInput(value: unknown): LoginInput {
  const body = asObject(value);
  return {
    email: text(body.email, "email", { min: 6, max: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }).toLowerCase(),
    password: text(body.password, "password", { min: 1, max: 256 })
  };
}

export interface BriefInput {
  expectedRevision: number;
  reviewNote: string;
  actions: ActionCard[];
}

function parseAction(value: unknown, index: number): ActionCard {
  const item = asObject(value);
  const actionId = text(item.actionId, `actions.${index}.actionId`, { min: 3, max: 64 }) as ActionId;
  if (!(actionIds as readonly string[]).includes(actionId)) {
    throw new ContractValidationError({ [`actions.${index}.actionId`]: "Action ID tidak dikenal." });
  }
  const owner = text(item.owner, `actions.${index}.owner`, { min: 3, max: 32 }) as ActionCard["owner"];
  if (!(governmentRoles as readonly string[]).includes(owner)) {
    throw new ContractValidationError({ [`actions.${index}.owner`]: "Pemilik tindakan tidak dikenal." });
  }
  const textValue = text(item.text, `actions.${index}.text`, { min: 5, max: 500 });
  return { actionId, owner, text: textValue };
}

export function parseBriefInput(value: unknown): BriefInput {
  const body = asObject(value);
  if (!Array.isArray(body.actions) || body.actions.length < 1 || body.actions.length > actionIds.length) {
    throw new ContractValidationError({ actions: "Action brief harus memuat 1 sampai 5 tindakan." });
  }
  const actions = body.actions.map(parseAction);
  if (new Set(actions.map((action) => action.actionId)).size !== actions.length) {
    throw new ContractValidationError({ actions: "Action ID tidak boleh duplikat." });
  }
  return {
    expectedRevision: revision(body.expectedRevision),
    reviewNote: text(body.reviewNote, "reviewNote", { min: 0, max: 2_000 }),
    actions
  };
}

export interface PublicationDraftInput {
  expectedRevision: number;
  text: string;
}

export function parsePublicationDraftInput(value: unknown): PublicationDraftInput {
  const body = asObject(value);
  return {
    expectedRevision: revision(body.expectedRevision),
    text: text(body.text, "text", { min: 10, max: 1_500 })
  };
}

export interface VersionInput {
  expectedRevision: number;
}

export function parseVersionInput(value: unknown): VersionInput {
  return { expectedRevision: revision(asObject(value).expectedRevision) };
}

export interface RejectPublicationInput extends VersionInput {
  rejectionNote: string;
}

export function parseRejectPublicationInput(value: unknown): RejectPublicationInput {
  const body = asObject(value);
  return {
    expectedRevision: revision(body.expectedRevision),
    rejectionNote: text(body.rejectionNote, "rejectionNote", { min: 5, max: 1_500 })
  };
}

export const simulationPresets = ["MONITOR", "VERIFY", "HIGH_PONTIANAK", "STALE"] as const;
export type SimulationPreset = (typeof simulationPresets)[number];

export interface SimulationInput {
  preset: SimulationPreset;
}

export function parseSimulationInput(value: unknown): SimulationInput {
  const body = asObject(value);
  if (typeof body.preset !== "string" || !(simulationPresets as readonly string[]).includes(body.preset)) {
    throw new ContractValidationError({ preset: "Preset simulasi tidak dikenal." });
  }
  return { preset: body.preset as SimulationPreset };
}

export interface DemoTelemetryInput {
  locationId: string;
  aqi: number;
  /** Empty means no simulated event. A single event keeps the simulator deliberately simple. */
  hazards: Array<{ type: HazardType; severity: number }>;
}

function boundedNumber(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new ContractValidationError({ [field]: `${field} harus berada pada rentang ${min} sampai ${max}.` });
  }
  return value;
}

/** Admin demo only: a deliberately narrow, validated telemetry payload for local walkthroughs. */
export function parseDemoTelemetryInput(value: unknown): DemoTelemetryInput {
  const body = asObject(value);
  if (!Array.isArray(body.hazards) || body.hazards.length > 1) {
    throw new ContractValidationError({ hazards: "Pilih paling banyak satu indikasi kejadian." });
  }
  const hazards = body.hazards.map((value, index) => {
    const item = asObject(value);
    const type = text(item.type, `hazards.${index}.type`, { min: 3, max: 32 }) as HazardType;
    if (!(hazardTypes as readonly string[]).includes(type)) throw new ContractValidationError({ [`hazards.${index}.type`]: "Jenis kejadian tidak dikenal." });
    return { type, severity: boundedNumber(item.severity, `hazards.${index}.severity`, 1, 5) };
  });
  if (new Set(hazards.map((hazard) => hazard.type)).size !== hazards.length) {
    throw new ContractValidationError({ hazards: "Jenis kejadian tidak boleh duplikat." });
  }
  return {
    locationId: text(body.locationId, "locationId", { min: 3, max: 96, pattern: /^[a-z0-9-]+$/ }),
    aqi: boundedNumber(body.aqi, "aqi", 0, 500),
    hazards
  };
}
