import { demoReferencePoint, isDemoReferencePointId } from "./demo-locations";

export const DEMO_SCENARIO_VERSION = 1;

export const DEMO_ROLES = ["SIMULATOR", "DLH", "BPBD", "APPROVER", "WARGA"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];
export type InternalDemoRole = Exclude<DemoRole, "WARGA">;

export type WorkflowStep = "READY" | "ENVIRONMENT_PENDING" | "ENVIRONMENT_VALIDATED" | "INCIDENT_VERIFIED" | "RESPONSE_RECORDED" | "PUBLISHED";
export const WIND_DIRECTIONS = ["Tenggara", "Selatan", "Barat Daya", "Barat"] as const;
export const WIND_SPEEDS = [8, 18, 28] as const;
export const FIRE_INTENSITIES = [1, 2, 3, 4, 5] as const;
export const IMPACT_RADII = [5, 10, 15, 20] as const;
export type WindDirection = (typeof WIND_DIRECTIONS)[number];
export type WindSpeed = (typeof WIND_SPEEDS)[number];
export type FireIntensity = (typeof FIRE_INTENSITIES)[number];
export type ImpactRadius = (typeof IMPACT_RADII)[number];
export type FireHazeStatus = "FIRE" | "HAZE";
export type ScenarioEventCommand = "CREATE_SCENARIO" | "PLAY_SIMULATION" | "PAUSE_SIMULATION" | "SET_WIND_DIRECTION" | "SET_WIND_SPEED" | "SET_FIRE_INTENSITY" | "SET_SOURCE_POINT" | "SET_FIRE_HAZE_STATUS" | "SET_IMPACT_RADIUS" | "SET_AQI" | "SET_PM25" | "VALIDATE_ENVIRONMENT" | "VERIFY_INCIDENT" | "RECORD_RESPONSE" | "PUBLISH_NOTICE";

export type DemoScenarioEvent = {
  at: string;
  actor: InternalDemoRole;
  command: ScenarioEventCommand;
  note?: string;
  action?: string;
  windDirection?: WindDirection;
  windSpeed?: WindSpeed;
  fireIntensity?: FireIntensity;
  sourcePointId?: string;
  fireHazeStatus?: FireHazeStatus;
  impactRadiusKm?: ImpactRadius;
  aqi?: number;
  pm25?: number;
};

export type DemoSimulation = {
  isPlaying: boolean;
  windDirection: WindDirection;
  windSpeed: WindSpeed;
  fireIntensity: FireIntensity;
  sourcePointId: string;
  fireHazeStatus: FireHazeStatus;
  impactRadiusKm: ImpactRadius;
  aqiOverride: number | null;
  pm25Override: number | null;
};

export type DemoScenario = {
  version: typeof DEMO_SCENARIO_VERSION;
  isSynthetic: true;
  workflow: WorkflowStep;
  simulation: DemoSimulation;
  region: { name: string; province: string; slug: string };
  createdAt: string | null;
  observation: { aqi: number; pm25: number; wind: string; summary: string } | null;
  environmentalValidation: { validatedBy: "DLH"; validatedAt: string; note: string } | null;
  incident: { verifiedBy: "BPBD"; verifiedAt: string; classification: string } | null;
  response: { recordedBy: "BPBD"; recordedAt: string; action: string } | null;
  notice: { status: "DRAFT" | "PUBLISHED"; text: string; approvedBy: "APPROVER" | null; publishedAt: string | null } | null;
  events: DemoScenarioEvent[];
};

export type PublicDemoNotice = {
  region: DemoScenario["region"];
  notice: { text: string; publishedAt: string; aqi: number; pm25: number };
};

export type DemoMapProjection = {
  center: [number, number];
  fire: [number, number];
  hazeRadiusMeters: number;
  windEnd: [number, number];
  windLabel: string;
  fireIntensity: FireIntensity;
  sourcePointId: string;
  isActive: boolean;
};

export type DemoCommand =
  | { type: "CREATE_SCENARIO"; actor: DemoRole }
  | { type: "PLAY_SIMULATION"; actor: DemoRole }
  | { type: "PAUSE_SIMULATION"; actor: DemoRole }
  | { type: "SET_WIND_DIRECTION"; actor: DemoRole; windDirection: WindDirection }
  | { type: "SET_WIND_SPEED"; actor: DemoRole; windSpeed: WindSpeed }
  | { type: "SET_FIRE_INTENSITY"; actor: DemoRole; fireIntensity: FireIntensity }
  | { type: "SET_SOURCE_POINT"; actor: DemoRole; sourcePointId: string }
  | { type: "SET_FIRE_HAZE_STATUS"; actor: DemoRole; fireHazeStatus: FireHazeStatus }
  | { type: "SET_IMPACT_RADIUS"; actor: DemoRole; impactRadiusKm: ImpactRadius }
  | { type: "SET_AQI"; actor: DemoRole; aqi: number }
  | { type: "SET_PM25"; actor: DemoRole; pm25: number }
  | { type: "VALIDATE_ENVIRONMENT"; actor: DemoRole; note?: string }
  | { type: "VERIFY_INCIDENT"; actor: DemoRole }
  | { type: "RECORD_RESPONSE"; actor: DemoRole; action?: string }
  | { type: "PUBLISH_NOTICE"; actor: DemoRole }
  | { type: "RESET_SCENARIO"; actor: DemoRole };

type WithoutActor<T> = T extends { actor: DemoRole } ? Omit<T, "actor"> : never;
export type DemoCommandInput = WithoutActor<DemoCommand>;

const demoRegion = { name: "Pontianak", province: "Kalimantan Barat", slug: "pontianak" } as const;
const noticeText = "Asap kebakaran lahan sintetis terpantau memengaruhi kualitas udara. Kurangi aktivitas luar ruang, gunakan masker bila perlu keluar, dan utamakan perlindungan anak-anak serta lansia.";
const workflowSteps: readonly WorkflowStep[] = ["READY", "ENVIRONMENT_PENDING", "ENVIRONMENT_VALIDATED", "INCIDENT_VERIFIED", "RESPONSE_RECORDED", "PUBLISHED"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isIsoTimestamp(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isScenarioEvent(value: unknown): value is DemoScenarioEvent {
  if (!isRecord(value) || !isIsoTimestamp(value.at) || !isString(value.actor) || !isString(value.command)) return false;
  if (!DEMO_ROLES.includes(value.actor as DemoRole) || value.actor === "WARGA") return false;
  if (!["CREATE_SCENARIO", "PLAY_SIMULATION", "PAUSE_SIMULATION", "SET_WIND_DIRECTION", "SET_WIND_SPEED", "SET_FIRE_INTENSITY", "SET_SOURCE_POINT", "SET_FIRE_HAZE_STATUS", "SET_IMPACT_RADIUS", "SET_AQI", "SET_PM25", "VALIDATE_ENVIRONMENT", "VERIFY_INCIDENT", "RECORD_RESPONSE", "PUBLISH_NOTICE"].includes(value.command)) return false;
  if (value.note !== undefined && !isString(value.note)) return false;
  if (value.action !== undefined && !isString(value.action)) return false;
  if (value.windDirection !== undefined && !WIND_DIRECTIONS.includes(value.windDirection as WindDirection)) return false;
  if (value.windSpeed !== undefined && !WIND_SPEEDS.includes(value.windSpeed as WindSpeed)) return false;
  if (value.fireIntensity !== undefined && !FIRE_INTENSITIES.includes(value.fireIntensity as FireIntensity)) return false;
  if (value.sourcePointId !== undefined && (!isString(value.sourcePointId) || !isDemoReferencePointId(value.sourcePointId))) return false;
  if (value.fireHazeStatus !== undefined && value.fireHazeStatus !== "FIRE" && value.fireHazeStatus !== "HAZE") return false;
  if (value.impactRadiusKm !== undefined && !IMPACT_RADII.includes(value.impactRadiusKm as ImpactRadius)) return false;
  if (value.aqi !== undefined && (typeof value.aqi !== "number" || value.aqi < 0 || value.aqi > 500)) return false;
  if (value.pm25 !== undefined && (typeof value.pm25 !== "number" || value.pm25 < 0 || value.pm25 > 500)) return false;

  if (value.command === "VALIDATE_ENVIRONMENT") return value.action === undefined && hasOnlyKeys(value, ["at", "actor", "command", "note"]);
  if (value.command === "RECORD_RESPONSE") return value.note === undefined && hasOnlyKeys(value, ["at", "actor", "command", "action"]);
  if (value.command === "SET_WIND_DIRECTION") return value.note === undefined && value.action === undefined && value.windSpeed === undefined && value.fireIntensity === undefined && hasOnlyKeys(value, ["at", "actor", "command", "windDirection"]);
  if (value.command === "SET_WIND_SPEED") return value.note === undefined && value.action === undefined && value.windDirection === undefined && value.fireIntensity === undefined && hasOnlyKeys(value, ["at", "actor", "command", "windSpeed"]);
  if (value.command === "SET_FIRE_INTENSITY") return value.note === undefined && value.action === undefined && value.windDirection === undefined && value.windSpeed === undefined && hasOnlyKeys(value, ["at", "actor", "command", "fireIntensity"]);
  if (value.command === "SET_SOURCE_POINT") return hasOnlyKeys(value, ["at", "actor", "command", "sourcePointId"]);
  if (value.command === "SET_FIRE_HAZE_STATUS") return hasOnlyKeys(value, ["at", "actor", "command", "fireHazeStatus"]);
  if (value.command === "SET_IMPACT_RADIUS") return hasOnlyKeys(value, ["at", "actor", "command", "impactRadiusKm"]);
  if (value.command === "SET_AQI") return hasOnlyKeys(value, ["at", "actor", "command", "aqi"]);
  if (value.command === "SET_PM25") return hasOnlyKeys(value, ["at", "actor", "command", "pm25"]);
  return value.note === undefined && value.action === undefined && value.windDirection === undefined && value.windSpeed === undefined && value.fireIntensity === undefined && hasOnlyKeys(value, ["at", "actor", "command"]);
}

function hasScenarioShape(value: unknown): value is DemoScenario {
  if (!isRecord(value) || value.version !== DEMO_SCENARIO_VERSION || value.isSynthetic !== true || !workflowSteps.includes(value.workflow as WorkflowStep)) return false;
  const simulation = value.simulation;
  if (!isRecord(simulation) || typeof simulation.isPlaying !== "boolean" || !WIND_DIRECTIONS.includes(simulation.windDirection as WindDirection) || !WIND_SPEEDS.includes(simulation.windSpeed as WindSpeed) || !FIRE_INTENSITIES.includes(simulation.fireIntensity as FireIntensity) || !isString(simulation.sourcePointId) || !isDemoReferencePointId(simulation.sourcePointId) || (simulation.fireHazeStatus !== "FIRE" && simulation.fireHazeStatus !== "HAZE") || !IMPACT_RADII.includes(simulation.impactRadiusKm as ImpactRadius) || (simulation.aqiOverride !== null && (typeof simulation.aqiOverride !== "number" || simulation.aqiOverride < 0 || simulation.aqiOverride > 500)) || (simulation.pm25Override !== null && (typeof simulation.pm25Override !== "number" || simulation.pm25Override < 0 || simulation.pm25Override > 500))) return false;
  if (!isRecord(value.region) || !isString(value.region.name) || !isString(value.region.province) || !isString(value.region.slug) || !Array.isArray(value.events) || !value.events.every(isScenarioEvent)) return false;
  if (value.createdAt !== null && !isIsoTimestamp(value.createdAt)) return false;
  if (value.observation !== null && (!isRecord(value.observation) || typeof value.observation.aqi !== "number" || typeof value.observation.pm25 !== "number" || !isString(value.observation.wind) || !isString(value.observation.summary))) return false;
  if (value.environmentalValidation !== null && (!isRecord(value.environmentalValidation) || value.environmentalValidation.validatedBy !== "DLH" || !isIsoTimestamp(value.environmentalValidation.validatedAt) || !isString(value.environmentalValidation.note))) return false;
  if (value.incident !== null && (!isRecord(value.incident) || value.incident.verifiedBy !== "BPBD" || !isIsoTimestamp(value.incident.verifiedAt) || !isString(value.incident.classification))) return false;
  if (value.response !== null && (!isRecord(value.response) || value.response.recordedBy !== "BPBD" || !isIsoTimestamp(value.response.recordedAt) || !isString(value.response.action))) return false;
  return value.notice === null || (isRecord(value.notice) && (value.notice.status === "DRAFT" || value.notice.status === "PUBLISHED") && isString(value.notice.text) && (value.notice.approvedBy === null || value.notice.approvedBy === "APPROVER") && (value.notice.publishedAt === null || isIsoTimestamp(value.notice.publishedAt)));
}

function sameJsonValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameJsonValue(value, right[index]));
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => Object.hasOwn(right, key) && sameJsonValue(left[key], right[key]));
}

export function initialDemoScenario(): DemoScenario {
  return {
    version: DEMO_SCENARIO_VERSION,
    isSynthetic: true,
    workflow: "READY",
    simulation: { isPlaying: false, windDirection: "Tenggara", windSpeed: 18, fireIntensity: 3, sourcePointId: "pontianak-utara", fireHazeStatus: "FIRE", impactRadiusKm: 15, aqiOverride: null, pm25Override: null },
    region: { ...demoRegion },
    createdAt: null,
    observation: null,
    environmentalValidation: null,
    incident: null,
    response: null,
    notice: null,
    events: []
  };
}

function reject(message: string): never { throw new Error(message); }
function requireActor(actor: DemoRole, allowed: DemoRole): void {
  if (actor !== allowed) reject(`${actor} tidak dapat melakukan tindakan ini. Tindakan ini hanya untuk ${allowed}.`);
}
function requireWorkflow(state: DemoScenario, expected: WorkflowStep): void {
  if (state.workflow !== expected) reject(`Tindakan belum tersedia. Status saat ini: ${state.workflow}.`);
}

function requireSimulatorControlWindow(state: DemoScenario): void {
  if (state.workflow !== "READY" && state.workflow !== "ENVIRONMENT_PENDING") reject("Kontrol Simulator hanya tersedia sebelum validasi DLH.");
}

function windLabel(simulation: DemoSimulation): string {
  return `${simulation.windDirection} · ${simulation.windSpeed} km/jam`;
}

function syntheticObservation(simulation: DemoSimulation): NonNullable<DemoScenario["observation"]> {
  const aqi = simulation.aqiOverride ?? 126 + simulation.fireIntensity * 11 + Math.round(simulation.windSpeed / 6);
  const pm25 = simulation.pm25Override ?? 38 + simulation.fireIntensity * 14 + Math.round(simulation.windSpeed / 4);
  return {
    aqi,
    pm25,
    wind: windLabel(simulation),
    summary: `Hotspot, kabut asap, dan dampak angin ${simulation.windDirection.toLowerCase()} adalah data uji untuk latihan.`
  };
}

function withSimulation(state: DemoScenario, simulation: DemoSimulation): DemoScenario {
  return { ...state, simulation, observation: state.observation ? syntheticObservation(simulation) : null };
}

function eventFor(command: Exclude<DemoCommand, { type: "RESET_SCENARIO" }>, at: string): DemoScenarioEvent {
  if (command.type === "VALIDATE_ENVIRONMENT") return command.note === undefined ? { at, actor: command.actor as InternalDemoRole, command: command.type } : { at, actor: command.actor as InternalDemoRole, command: command.type, note: command.note };
  if (command.type === "RECORD_RESPONSE") return command.action === undefined ? { at, actor: command.actor as InternalDemoRole, command: command.type } : { at, actor: command.actor as InternalDemoRole, command: command.type, action: command.action };
  if (command.type === "SET_WIND_DIRECTION") return { at, actor: command.actor as InternalDemoRole, command: command.type, windDirection: command.windDirection };
  if (command.type === "SET_WIND_SPEED") return { at, actor: command.actor as InternalDemoRole, command: command.type, windSpeed: command.windSpeed };
  if (command.type === "SET_FIRE_INTENSITY") return { at, actor: command.actor as InternalDemoRole, command: command.type, fireIntensity: command.fireIntensity };
  if (command.type === "SET_SOURCE_POINT") return { at, actor: command.actor as InternalDemoRole, command: command.type, sourcePointId: command.sourcePointId };
  if (command.type === "SET_FIRE_HAZE_STATUS") return { at, actor: command.actor as InternalDemoRole, command: command.type, fireHazeStatus: command.fireHazeStatus };
  if (command.type === "SET_IMPACT_RADIUS") return { at, actor: command.actor as InternalDemoRole, command: command.type, impactRadiusKm: command.impactRadiusKm };
  if (command.type === "SET_AQI") return { at, actor: command.actor as InternalDemoRole, command: command.type, aqi: command.aqi };
  if (command.type === "SET_PM25") return { at, actor: command.actor as InternalDemoRole, command: command.type, pm25: command.pm25 };
  return { at, actor: command.actor as InternalDemoRole, command: command.type };
}

function appendEvent(state: DemoScenario, command: Exclude<DemoCommand, { type: "RESET_SCENARIO" }>, at: string): DemoScenarioEvent[] {
  return [...state.events, eventFor(command, at)];
}

function transitionDemoCommand(state: DemoScenario, command: Exclude<DemoCommand, { type: "RESET_SCENARIO" }>, at: string): DemoScenario {
  switch (command.type) {
    case "CREATE_SCENARIO": {
      requireActor(command.actor, "SIMULATOR"); requireWorkflow(state, "READY");
      const simulation = { ...state.simulation, isPlaying: true };
      return { ...state, simulation, workflow: "ENVIRONMENT_PENDING", createdAt: at, observation: syntheticObservation(simulation), events: appendEvent(state, command, at) };
    }
    case "PLAY_SIMULATION": {
      requireActor(command.actor, "SIMULATOR"); requireWorkflow(state, "ENVIRONMENT_PENDING");
      if (state.simulation.isPlaying) reject("Simulasi sudah berjalan.");
      const next = withSimulation(state, { ...state.simulation, isPlaying: true });
      return { ...next, events: appendEvent(next, command, at) };
    }
    case "PAUSE_SIMULATION": {
      requireActor(command.actor, "SIMULATOR"); requireWorkflow(state, "ENVIRONMENT_PENDING");
      if (!state.simulation.isPlaying) reject("Simulasi sudah dijeda.");
      const next = withSimulation(state, { ...state.simulation, isPlaying: false });
      return { ...next, events: appendEvent(next, command, at) };
    }
    case "SET_WIND_DIRECTION": {
      requireActor(command.actor, "SIMULATOR"); requireSimulatorControlWindow(state);
      const next = withSimulation(state, { ...state.simulation, windDirection: command.windDirection });
      return { ...next, events: appendEvent(next, command, at) };
    }
    case "SET_WIND_SPEED": {
      requireActor(command.actor, "SIMULATOR"); requireSimulatorControlWindow(state);
      const next = withSimulation(state, { ...state.simulation, windSpeed: command.windSpeed });
      return { ...next, events: appendEvent(next, command, at) };
    }
    case "SET_FIRE_INTENSITY": {
      requireActor(command.actor, "SIMULATOR"); requireSimulatorControlWindow(state);
      const next = withSimulation(state, { ...state.simulation, fireIntensity: command.fireIntensity });
      return { ...next, events: appendEvent(next, command, at) };
    }
    case "SET_SOURCE_POINT": { requireActor(command.actor, "SIMULATOR"); requireSimulatorControlWindow(state); if (!isDemoReferencePointId(command.sourcePointId)) reject("Titik sumber data uji tidak dikenal."); const next = withSimulation(state, { ...state.simulation, sourcePointId: command.sourcePointId }); return { ...next, events: appendEvent(next, command, at) }; }
    case "SET_FIRE_HAZE_STATUS": { requireActor(command.actor, "SIMULATOR"); requireSimulatorControlWindow(state); const next = withSimulation(state, { ...state.simulation, fireHazeStatus: command.fireHazeStatus }); return { ...next, events: appendEvent(next, command, at) }; }
    case "SET_IMPACT_RADIUS": { requireActor(command.actor, "SIMULATOR"); requireSimulatorControlWindow(state); const next = withSimulation(state, { ...state.simulation, impactRadiusKm: command.impactRadiusKm }); return { ...next, events: appendEvent(next, command, at) }; }
    case "SET_AQI": { requireActor(command.actor, "SIMULATOR"); requireSimulatorControlWindow(state); const next = withSimulation(state, { ...state.simulation, aqiOverride: command.aqi }); return { ...next, events: appendEvent(next, command, at) }; }
    case "SET_PM25": { requireActor(command.actor, "SIMULATOR"); requireSimulatorControlWindow(state); const next = withSimulation(state, { ...state.simulation, pm25Override: command.pm25 }); return { ...next, events: appendEvent(next, command, at) }; }
    case "VALIDATE_ENVIRONMENT": {
      requireActor(command.actor, "DLH"); requireWorkflow(state, "ENVIRONMENT_PENDING");
      return { ...state, workflow: "ENVIRONMENT_VALIDATED", environmentalValidation: { validatedBy: "DLH", validatedAt: at, note: command.note?.trim() || "AQI, PM2.5, arah angin, dan dampak asap telah divalidasi sebagai data uji." }, events: appendEvent(state, command, at) };
    }
    case "VERIFY_INCIDENT": {
      requireActor(command.actor, "BPBD"); requireWorkflow(state, "ENVIRONMENT_VALIDATED");
      return { ...state, workflow: "INCIDENT_VERIFIED", incident: { verifiedBy: "BPBD", verifiedAt: at, classification: "Kebakaran lahan sintetis terverifikasi untuk respons latihan." }, events: appendEvent(state, command, at) };
    }
    case "RECORD_RESPONSE": {
      requireActor(command.actor, "BPBD"); requireWorkflow(state, "INCIDENT_VERIFIED");
      return { ...state, workflow: "RESPONSE_RECORDED", response: { recordedBy: "BPBD", recordedAt: at, action: command.action?.trim() || "Aktifkan koordinasi posko latihan dan siapkan draf informasi warga." }, notice: { status: "DRAFT", text: noticeText, approvedBy: null, publishedAt: null }, events: appendEvent(state, command, at) };
    }
    case "PUBLISH_NOTICE": {
      requireActor(command.actor, "APPROVER"); requireWorkflow(state, "RESPONSE_RECORDED");
      if (!state.notice || state.notice.status !== "DRAFT") reject("Tidak ada draf informasi warga yang siap disetujui.");
      return { ...state, workflow: "PUBLISHED", notice: { ...state.notice, status: "PUBLISHED", approvedBy: "APPROVER", publishedAt: at }, events: appendEvent(state, command, at) };
    }
  }
}

function commandFromEvent(event: DemoScenarioEvent): Exclude<DemoCommand, { type: "RESET_SCENARIO" }> {
  if (event.command === "VALIDATE_ENVIRONMENT") return { type: event.command, actor: event.actor, ...(event.note === undefined ? {} : { note: event.note }) };
  if (event.command === "RECORD_RESPONSE") return { type: event.command, actor: event.actor, ...(event.action === undefined ? {} : { action: event.action }) };
  if (event.command === "SET_WIND_DIRECTION") return { type: event.command, actor: event.actor, windDirection: event.windDirection! };
  if (event.command === "SET_WIND_SPEED") return { type: event.command, actor: event.actor, windSpeed: event.windSpeed! };
  if (event.command === "SET_FIRE_INTENSITY") return { type: event.command, actor: event.actor, fireIntensity: event.fireIntensity! };
  if (event.command === "SET_SOURCE_POINT") return { type: event.command, actor: event.actor, sourcePointId: event.sourcePointId! };
  if (event.command === "SET_FIRE_HAZE_STATUS") return { type: event.command, actor: event.actor, fireHazeStatus: event.fireHazeStatus! };
  if (event.command === "SET_IMPACT_RADIUS") return { type: event.command, actor: event.actor, impactRadiusKm: event.impactRadiusKm! };
  if (event.command === "SET_AQI") return { type: event.command, actor: event.actor, aqi: event.aqi! };
  if (event.command === "SET_PM25") return { type: event.command, actor: event.actor, pm25: event.pm25! };
  return { type: event.command, actor: event.actor };
}

/**
 * Browser storage and BroadcastChannel messages are untrusted demo input.
 * Replaying their ordered event log from the deterministic initial state
 * prevents a hand-written snapshot from skipping accountable transitions.
 */
export function replayDemoScenarioEvents(events: unknown): DemoScenario | null {
  if (!Array.isArray(events) || !events.every(isScenarioEvent)) return null;
  try {
    return events.reduce((state, event) => transitionDemoCommand(state, commandFromEvent(event), event.at), initialDemoScenario());
  } catch {
    return null;
  }
}

export function isDemoScenario(value: unknown): value is DemoScenario {
  if (!hasScenarioShape(value)) return false;
  const replayed = replayDemoScenarioEvents(value.events);
  return replayed !== null && sameJsonValue(replayed, value);
}

/** Pure role-aware transition boundary for the browser-local demo. */
export function applyDemoCommand(state: DemoScenario, command: DemoCommand, at = new Date().toISOString()): DemoScenario {
  if (!isDemoScenario(state)) reject("Status skenario lokal tidak valid. Reset skenario sebelum melanjutkan.");
  if (!isIsoTimestamp(at)) reject("Waktu skenario lokal tidak valid.");
  if (command.type === "RESET_SCENARIO") {
    requireActor(command.actor, "SIMULATOR");
    return initialDemoScenario();
  }
  return transitionDemoCommand(state, command, at);
}

export function eventLabel(event: DemoScenarioEvent): string {
  const labels: Record<ScenarioEventCommand, string> = {
    CREATE_SCENARIO: "Simulator membuat skenario kebakaran lahan dan asap sintetis.",
    PLAY_SIMULATION: "Simulator melanjutkan simulasi sintetis.",
    PAUSE_SIMULATION: "Simulator menjeda simulasi sintetis.",
    SET_WIND_DIRECTION: "Simulator mengubah arah angin data uji.",
    SET_WIND_SPEED: "Simulator mengubah kecepatan angin data uji.",
    SET_FIRE_INTENSITY: "Simulator mengubah intensitas api data uji.",
    SET_SOURCE_POINT: "Simulator memilih titik sumber data uji.",
    SET_FIRE_HAZE_STATUS: "Simulator mengubah status api atau asap data uji.",
    SET_IMPACT_RADIUS: "Simulator mengubah radius dampak data uji.",
    SET_AQI: "Simulator mengubah AQI data uji.",
    SET_PM25: "Simulator mengubah PM2.5 data uji.",
    VALIDATE_ENVIRONMENT: "DLH memvalidasi dampak lingkungan sintetis.",
    VERIFY_INCIDENT: "BPBD memverifikasi insiden sintetis.",
    RECORD_RESPONSE: "BPBD mencatat tindakan respons dan membuat draf informasi warga.",
    PUBLISH_NOTICE: "Approver manusia menerbitkan informasi warga sintetis."
  };
  return labels[event.command];
}

export function projectPublicDemoNotice(state: DemoScenario): PublicDemoNotice | null {
  if (!isDemoScenario(state) || state.workflow !== "PUBLISHED" || !state.notice || state.notice.status !== "PUBLISHED" || !state.notice.publishedAt || !state.observation) return null;
  return { region: state.region, notice: { text: state.notice.text, publishedAt: state.notice.publishedAt, aqi: state.observation.aqi, pm25: state.observation.pm25 } };
}

export function projectDemoMap(state: DemoScenario): DemoMapProjection {
  const source = demoReferencePoint(state.simulation.sourcePointId);
  const center: [number, number] = source.coordinates;
  const fire: [number, number] = source.coordinates;
  const bearings: Record<WindDirection, number> = { Tenggara: 135, Selatan: 180, "Barat Daya": 225, Barat: 270 };
  const radians = bearings[state.simulation.windDirection] * Math.PI / 180;
  const reach = 0.045 + state.simulation.windSpeed / 1_000;
  const windEnd: [number, number] = [fire[0] + Math.cos(radians) * reach, fire[1] + Math.sin(radians) * reach];
  return {
    center,
    fire,
    hazeRadiusMeters: state.simulation.impactRadiusKm * 1_000,
    windEnd,
    windLabel: windLabel(state.simulation),
    fireIntensity: state.simulation.fireIntensity,
    sourcePointId: source.id,
    isActive: state.workflow !== "READY"
  };
}

export function serializeDemoScenario(state: DemoScenario): string {
  if (!isDemoScenario(state)) reject("Status skenario lokal tidak valid dan tidak dapat disimpan.");
  return JSON.stringify(state);
}

export function deserializeDemoScenario(raw: string | null): DemoScenario | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isDemoScenario(parsed) ? parsed : null;
  } catch { return null; }
}
