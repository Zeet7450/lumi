import type { DemoRole, DemoScenario } from "./demo-scenario";

export const DEMO_CASES_VERSION = 1;

export const CASE_AGENCIES = ["DLH", "BPBD", "BNPB", "KLHK"] as const;
export type CaseAgency = (typeof CASE_AGENCIES)[number];
export type CaseActor = "SIMULATOR" | CaseAgency;

export const CASE_ACTIONS = ["CREATE_CASE", "BPBD_VERIFY", "BPBD_REJECT", "DLH_MONITOR", "DISSEMINATE_INFO", "BPBD_COMPLETE", "BPBD_REQUEST_HELP", "BNPB_HANDOVER", "DLH_REPORT_KLH", "KLH_APPROVE", "KLH_ASSIST_DONE", "DLH_COMPLETE"] as const;
export type CaseAction = (typeof CASE_ACTIONS)[number];

export type CaseStatus = "DETECTED" | "BPBD_REJECTED" | "BPBD_VERIFIED" | "DLH_MONITORING" | "INFO_DISSEMINATED" | "CLOSED";
export type KlhReview = "NONE" | "REPORTED" | "APPROVED" | "ASSIST_DONE";
export type BnpbStage = "NONE" | "HELPING" | "HANDED_OVER";

export type CaseSource = {
  classification: string;
  region: { name: string; province: string; slug: string };
  observation: { aqi: number; pm25: number; wind: string };
};

export type CaseEvent = { at: string; actor: CaseActor; action: CaseAction; note: string | null };

export type DemoCase = {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: CaseSource;
  status: CaseStatus;
  klhReview: KlhReview;
  bnpbStage: BnpbStage;
  bpbdDone: boolean;
  disseminated: boolean;
  closedBy: CaseAgency | null;
  events: CaseEvent[];
};

export type CaseNotification = { id: string; caseId: string; at: string; audience: CaseActor[]; title: string; detail: string };
export type CaseAuditEntry = { id: string; at: string; actor: CaseActor; caseId: string; action: CaseAction; detail: string };
export type DemoCaseState = { version: typeof DEMO_CASES_VERSION; isSynthetic: true; cases: DemoCase[]; seen: Record<string, DemoRole[]> };

export type CaseCommand =
  | { type: "CREATE_CASE"; actor: DemoRole; source: CaseSource }
  | { type: "CASE_ACTION"; actor: DemoRole; caseId: string; action: CaseAction; note?: string }
  | { type: "MARK_NOTIFICATIONS_SEEN"; actor: DemoRole; ids: string[] };
/** Distributive so the input stays a discriminated union the store can narrow. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type CaseCommandInput = DistributiveOmit<CaseCommand, "actor">;

const ACTION_ACTOR: Record<CaseAction, CaseActor> = {
  CREATE_CASE: "SIMULATOR",
  BPBD_VERIFY: "BPBD",
  BPBD_REJECT: "BPBD",
  DLH_MONITOR: "DLH",
  DISSEMINATE_INFO: "DLH",
  BPBD_COMPLETE: "BPBD",
  BPBD_REQUEST_HELP: "BPBD",
  BNPB_HANDOVER: "BNPB",
  DLH_REPORT_KLH: "DLH",
  KLH_APPROVE: "KLHK",
  KLH_ASSIST_DONE: "KLHK",
  DLH_COMPLETE: "DLH"
};

/**
 * Who must know about each action. The initiator is deliberately absent: the
 * accountability trail lives in the audit log, not in a self-notification.
 */
const ACTION_AUDIENCE: Record<CaseAction, CaseActor[]> = {
  CREATE_CASE: ["BPBD"],
  BPBD_VERIFY: ["DLH", "KLHK"],
  BPBD_REJECT: [],
  DLH_MONITOR: ["BPBD", "KLHK"],
  DISSEMINATE_INFO: ["BPBD", "KLHK", "BNPB"],
  BPBD_COMPLETE: ["DLH", "KLHK", "BNPB"],
  BPBD_REQUEST_HELP: ["BNPB", "KLHK", "DLH"],
  BNPB_HANDOVER: ["BPBD", "KLHK", "DLH"],
  DLH_REPORT_KLH: ["KLHK", "BPBD", "BNPB"],
  KLH_APPROVE: ["DLH", "BPBD", "BNPB"],
  KLH_ASSIST_DONE: ["DLH", "BPBD", "BNPB"],
  DLH_COMPLETE: ["BPBD", "KLHK", "BNPB"]
};

const ACTION_LABEL: Record<CaseAction, string> = {
  CREATE_CASE: "Kasus terdeteksi dari simulasi",
  BPBD_VERIFY: "BPBD Provinsi memverifikasi kasus",
  BPBD_REJECT: "BPBD Provinsi menolak kasus",
  DLH_MONITOR: "DLH Provinsi menerima dan memantau AQI",
  DISSEMINATE_INFO: "Informasi disebar ke warga bersama Diskominfo",
  BPBD_COMPLETE: "BPBD Provinsi menyatakan penanganan lapangan selesai",
  BPBD_REQUEST_HELP: "BPBD Provinsi meminta bantuan BNPB",
  BNPB_HANDOVER: "BNPB menyerahkan kembali penanganan ke BPBD Provinsi",
  DLH_REPORT_KLH: "DLH Provinsi melaporkan ke KLH untuk broadcast nasional",
  KLH_APPROVE: "KLH menyetujui broadcast nasional",
  KLH_ASSIST_DONE: "KLH menyatakan bantuan selesai",
  DLH_COMPLETE: "DLH Provinsi menyatakan kasus selesai"
};

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function isString(value: unknown): value is string { return typeof value === "string"; }
function isIsoTimestamp(value: unknown): value is string {
  if (!isString(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
}
function reject(message: string): never { throw new Error(message); }

const ROLE_LABEL: Record<DemoRole, string> = { SIMULATOR: "Simulator", DLH: "DLH Provinsi", BPBD: "BPBD Provinsi", BNPB: "BNPB", KLHK: "KLHK", APPROVER: "Approver", WARGA: "Warga" };

function requireCaseActor(role: DemoRole): CaseActor {
  if (role === "WARGA" || role === "APPROVER") reject(`Peran ${ROLE_LABEL[role]} tidak memiliki akses ke alur kasus lintas instansi.`);
  return role;
}

export function initialDemoCaseState(): DemoCaseState {
  return { version: DEMO_CASES_VERSION, isSynthetic: true, cases: [], seen: {} };
}

export function caseSourceFromScenario(scenario: DemoScenario): CaseSource {
  if (!scenario.observation) reject("Observasi belum tersedia. Jalankan skenario data uji terlebih dahulu.");
  return {
    classification: scenario.simulation.sources[0]?.eventType === "CUSTOM" && scenario.simulation.sources[0].customName.trim() ? scenario.simulation.sources[0].customName.trim() : scenario.simulation.fireHazeStatus === "HAZE" ? "Pencemaran/kabut asap" : "Kebakaran lahan",
    region: { ...scenario.region },
    observation: { aqi: scenario.observation.aqi, pm25: scenario.observation.pm25, wind: scenario.observation.wind }
  };
}

export function formatCaseTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

export function caseStatusLabel(value: CaseStatus): string {
  return value === "DETECTED" ? "Menunggu verifikasi BPBD" : value === "BPBD_REJECTED" ? "Ditolak BPBD Provinsi" : value === "BPBD_VERIFIED" ? "Terverifikasi BPBD · menunggu DLH" : value === "DLH_MONITORING" ? "DLH memantau" : value === "INFO_DISSEMINATED" ? "Informasi tersebar · tindak lanjut" : "Selesai";
}

export function caseActionLabel(action: CaseAction): string { return ACTION_LABEL[action]; }

export function isCaseOpen(value: DemoCase): boolean { return value.status !== "CLOSED" && value.status !== "BPBD_REJECTED"; }

/** Only DLH closes a case in the end, and only once BPBD's field work is done. */
export function canCloseCase(value: DemoCase, actor: CaseActor): boolean {
  if (!isCaseOpen(value) || actor !== "DLH") return false;
  return value.bpbdDone && value.status === "INFO_DISSEMINATED";
}

function requireActor(actor: CaseActor, allowed: CaseActor): void {
  if (actor !== allowed) reject(`${actor} tidak dapat melakukan tindakan ini. Tindakan ini hanya untuk ${allowed}.`);
}
function requireOpen(value: DemoCase): void {
  if (!isCaseOpen(value)) reject("Kasus ini sudah selesai dan tidak dapat diubah lagi.");
}
function requireStatus(value: DemoCase, allowed: CaseStatus[]): void {
  if (!allowed.includes(value.status)) reject(`Tindakan belum tersedia pada status ${caseStatusLabel(value.status)}.`);
}

/**
 * One forward-only transition. Every rule here can only move a case along the
 * provincial escalation ladder; there is intentionally no command that undoes
 * a verification, an escalation, or a closure.
 */
function transitionCase(current: DemoCase, action: CaseAction, at: string): DemoCase {
  requireOpen(current);
  const base = { ...current, updatedAt: at };
  switch (action) {
    case "BPBD_VERIFY": {
      requireStatus(current, ["DETECTED"]);
      return { ...base, status: "BPBD_VERIFIED" };
    }
    case "BPBD_REJECT": {
      requireStatus(current, ["DETECTED"]);
      return { ...base, status: "BPBD_REJECTED" };
    }
    case "DLH_MONITOR": {
      requireStatus(current, ["BPBD_VERIFIED"]);
      return { ...base, status: "DLH_MONITORING" };
    }
    case "DISSEMINATE_INFO": {
      requireStatus(current, ["DLH_MONITORING"]);
      if (current.disseminated) reject("Informasi untuk kasus ini sudah disebarkan.");
      return { ...base, status: "INFO_DISSEMINATED", disseminated: true };
    }
    case "BPBD_COMPLETE": {
      requireStatus(current, ["INFO_DISSEMINATED"]);
      if (current.bpbdDone) reject("Penanganan lapangan BPBD Provinsi sudah dinyatakan selesai.");
      if (current.bnpbStage === "HELPING") reject("Penanganan masih ditangani BNPB; minta BNPB menyerahkan kembali lebih dulu.");
      return { ...base, bpbdDone: true };
    }
    case "BPBD_REQUEST_HELP": {
      requireStatus(current, ["INFO_DISSEMINATED"]);
      if (current.bpbdDone) reject("Penanganan lapangan sudah selesai; tidak ada yang dieskalasi.");
      if (current.bnpbStage === "HELPING") reject("Bantuan BNPB sudah diminta pada kasus ini.");
      return { ...base, bnpbStage: "HELPING", klhReview: current.klhReview === "NONE" ? "NONE" : current.klhReview };
    }
    case "BNPB_HANDOVER": {
      requireStatus(current, ["INFO_DISSEMINATED"]);
      if (current.bnpbStage !== "HELPING") reject("BNPB tidak sedang membantu pada kasus ini.");
      return { ...base, bnpbStage: "HANDED_OVER" };
    }
    case "DLH_REPORT_KLH": {
      requireStatus(current, ["INFO_DISSEMINATED"]);
      if (current.klhReview !== "NONE") reject("Laporan ke KLH sudah dibuat pada kasus ini.");
      return { ...base, klhReview: "REPORTED" };
    }
    case "KLH_APPROVE": {
      if (current.klhReview !== "REPORTED") reject("Kasus ini belum dilaporkan ke KLH atau sudah disetujui.");
      return { ...base, klhReview: "APPROVED" };
    }
    case "KLH_ASSIST_DONE": {
      if (current.klhReview !== "APPROVED") reject("KLH belum menyetujui bantuan apa pun pada kasus ini.");
      return { ...base, klhReview: "ASSIST_DONE" };
    }
    case "DLH_COMPLETE": {
      if (!canCloseCase(current, "DLH")) reject(current.bpbdDone ? "Sebar informasi warga bersama Diskominfo lebih dulu sebelum menutup kasus." : "Penyelesaian akhir menunggu BPBD Provinsi menyatakan penanganan lapangan selesai.");
      return { ...base, status: "CLOSED", closedBy: "DLH" };
    }
    case "CREATE_CASE": reject("Kasus dibuat lewat perintah CREATE_CASE, bukan CASE_ACTION.");
  }
}

function createCase(source: CaseSource, at: string): DemoCase {
  return {
    id: `kasus-${at}`,
    createdAt: at,
    updatedAt: at,
    source,
    status: "DETECTED",
    klhReview: "NONE",
    bnpbStage: "NONE",
    bpbdDone: false,
    disseminated: false,
    closedBy: null,
    events: [{ at, actor: "SIMULATOR", action: "CREATE_CASE", note: null }]
  };
}

function requireCase(state: DemoCaseState, caseId: string): DemoCase {
  const found = state.cases.find((item) => item.id === caseId);
  if (!found) reject("Kasus tidak ditemukan pada data demo ini.");
  return found;
}

function withCase(state: DemoCaseState, next: DemoCase): DemoCaseState {
  return { ...state, cases: state.cases.map((item) => item.id === next.id ? next : item) };
}

export function caseNotifications(value: DemoCase): CaseNotification[] {
  return value.events.flatMap((event, index) => {
    const audience = ACTION_AUDIENCE[event.action];
    if (!audience.length) return [];
    const content = notificationContent(event.action, value);
    return [{ id: `${value.id}:${index}`, caseId: value.id, at: event.at, audience: [...audience], title: content.title, detail: content.detail }];
  });
}

function notificationContent(action: CaseAction, value: DemoCase): { title: string; detail: string } {
  const where = `${value.source.classification} · ${value.source.region.name}`;
  if (action === "CREATE_CASE") return { title: "Kasus baru terdeteksi", detail: `${where} menunggu verifikasi BPBD Provinsi.` };
  if (action === "BPBD_VERIFY") return { title: "Kasus terverifikasi BPBD Provinsi", detail: `${where} diteruskan ke DLH Provinsi untuk pemantauan.` };
  if (action === "DLH_MONITOR") return { title: "DLH Provinsi memantau kasus", detail: `${where} kini dipantau AQI-nya oleh DLH Provinsi.` };
  if (action === "DISSEMINATE_INFO") return { title: "Informasi warga disebar", detail: `${where} informasinya disebarkan ke web warga dan notifikasi bersama Diskominfo.` };
  if (action === "BPBD_COMPLETE") return { title: "Penanganan lapangan selesai", detail: `${where} dinyatakan selesai di lapangan oleh BPBD Provinsi; pemantauan DLH berlanjut.` };
  if (action === "BPBD_REQUEST_HELP") return { title: "Permintaan bantuan BNPB", detail: `${where} dieskalasi karena kapasitas BPBD Provinsi tidak cukup.` };
  if (action === "BNPB_HANDOVER") return { title: "BNPB serah kembali", detail: `${where} penanganannya kembali penuh ke BPBD Provinsi.` };
  if (action === "DLH_REPORT_KLH") return { title: "Laporan broadcast nasional", detail: `${where} dilaporkan ke KLH agar aware secara nasional.` };
  if (action === "KLH_APPROVE") return { title: "KLH menyetujui broadcast", detail: `${where} masuk broadcast nasional bersama Kominfo.` };
  if (action === "KLH_ASSIST_DONE") return { title: "KLH selesai membantu", detail: `${where} bantuan KLH dinyatakan selesai.` };
  if (action === "DLH_COMPLETE") return { title: "Kasus dinyatakan selesai", detail: `${where} dinyatakan selesai oleh DLH Provinsi.` };
  return { title: "Kasus ditolak BPBD Provinsi", detail: `${where} ditolak karena tidak sesuai kriteria BPBD Provinsi.` };
}

export function auditTrail(state: DemoCaseState): CaseAuditEntry[] {
  return state.cases.flatMap((value) => value.events.map((event, index) => ({ id: `${value.id}:${index}`, at: event.at, actor: event.actor, caseId: value.id, action: event.action, detail: event.note ?? "" }))).sort((left, right) => right.at.localeCompare(left.at));
}

export function notificationsForRole(state: DemoCaseState, role: DemoRole): Array<CaseNotification & { seen: boolean }> {
  return state.cases.flatMap(caseNotifications).filter((item) => item.audience.includes(role as CaseActor)).sort((left, right) => right.at.localeCompare(left.at)).map((item) => ({ ...item, seen: (state.seen[item.id] ?? []).includes(role) }));
}

export function unseenNotifications(state: DemoCaseState, role: DemoRole): CaseNotification[] {
  return notificationsForRole(state, role).filter((item) => !item.seen);
}

/** Accountable "whose turn is it" view — the demo shows non-response instead of hiding it. */
export function pendingResponders(state: DemoCaseState): Array<{ caseId: string; agency: CaseAgency; label: string; since: string }> {
  return state.cases.filter(isCaseOpen).flatMap((value) => {
    const owners: Array<{ agency: CaseAgency; label: string }> = [];
    if (value.status === "DETECTED") owners.push({ agency: "BPBD", label: "Menunggu verifikasi BPBD Provinsi" });
    if (value.status === "BPBD_VERIFIED") owners.push({ agency: "DLH", label: "Menunggu DLH Provinsi menerima dan memantau" });
    if (value.status === "DLH_MONITORING") owners.push({ agency: "DLH", label: "Menunggu penyebaran informasi bersama Diskominfo" });
    if (value.status === "INFO_DISSEMINATED") {
      if (!value.bpbdDone) owners.push({ agency: "BPBD", label: "Menunggu penyelesaian atau permintaan bantuan BNPB" });
      if (value.bnpbStage === "HELPING") owners.push({ agency: "BNPB", label: "Menunggu BNPB menyerahkan kembali penanganan" });
      if (value.klhReview === "REPORTED") owners.push({ agency: "KLHK", label: "Menunggu persetujuan broadcast KLH" });
      if (value.klhReview === "APPROVED") owners.push({ agency: "KLHK", label: "Menunggu KLH menyatakan bantuan selesai" });
      if (value.bpbdDone && value.bnpbStage !== "HELPING") owners.push({ agency: "DLH", label: "Menunggu DLH Provinsi menyatakan kasus selesai" });
    }
    const unique = [...new Map(owners.map((owner) => [owner.agency, owner])).values()];
    const since = value.events.at(-1)?.at ?? value.createdAt;
    return unique.map((owner) => ({ caseId: value.id, ...owner, since }));
  });
}

export type CaseStepState = "done" | "active" | "locked" | "failed";
export type CaseStep = { label: string; state: CaseStepState; hint: string };
export type CaseStepView = "FIELD" | "BNPB" | "KLHK";

/** Horizontal, forward-only progress model rendered by the case stepper. */
export function caseSteps(value: DemoCase, view: CaseStepView): CaseStep[] {
  const detected = new Intl.DateTimeFormat("id-ID", { timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value.createdAt));
  if (view === "FIELD") return [
    { label: "Kasus terdeteksi", state: "done", hint: `Terdeteksi ${detected} WIB` },
    { label: "Verifikasi BPBD Provinsi", state: value.status === "DETECTED" ? "active" : value.status === "BPBD_REJECTED" ? "failed" : "done", hint: value.status === "DETECTED" ? "BPBD memverifikasi kasus" : value.status === "BPBD_REJECTED" ? "Kasus ditolak — alur berhenti" : "Terverifikasi BPBD" },
    { label: "DLH terima & pantau", state: value.status === "BPBD_VERIFIED" ? "active" : value.status === "DETECTED" || value.status === "BPBD_REJECTED" ? "locked" : "done", hint: value.status === "BPBD_VERIFIED" ? "DLH menerima dan memantau AQI" : "Pemantauan DLH Provinsi" },
    { label: "Sebar informasi warga", state: value.status === "INFO_DISSEMINATED" || value.status === "CLOSED" ? "done" : value.status === "DLH_MONITORING" ? "active" : "locked", hint: value.status === "DLH_MONITORING" ? "Bekerja sama dengan Diskominfo" : "Informasi warga & notifikasi" },
    { label: "Tindak lanjut & eskalasi", state: value.bpbdDone || value.bnpbStage === "HANDED_OVER" ? "done" : value.status === "INFO_DISSEMINATED" ? "active" : "locked", hint: value.bnpbStage === "HELPING" ? "BNPB membantu di lapangan" : value.bpbdDone ? "Penanganan lapangan selesai" : "Jalur BPBD dan DLH paralel" },
    { label: "Penutupan oleh DLH", state: value.status === "CLOSED" ? "done" : canCloseCase(value, "DLH") ? "active" : "locked", hint: value.closedBy ? `Ditutup ${value.closedBy}` : "DLH pemegang penutupan akhir" }
  ];
  if (view === "BNPB") return [
    { label: "Permintaan diterima", state: "done", hint: "BPBD Provinsi meminta bantuan" },
    { label: "BNPB membantu", state: value.bnpbStage === "HELPING" ? "active" : "done", hint: value.bnpbStage === "HELPING" ? "BNPB di lapangan" : "Bantuan BNPB berjalan" },
    { label: "Serah kembali ke BPBD", state: value.bnpbStage === "HANDED_OVER" ? "done" : "active", hint: value.bnpbStage === "HANDED_OVER" ? "Penanganan kembali ke BPBD Provinsi" : "Selesai membantu lalu serah kembali" }
  ];
  return [
    { label: "Laporan diterima", state: value.klhReview !== "NONE" ? "done" : "active", hint: "DLH Provinsi melaporkan untuk broadcast" },
    { label: "Persetujuan KLH", state: value.klhReview === "APPROVED" || value.klhReview === "ASSIST_DONE" ? "done" : value.klhReview === "REPORTED" ? "active" : "locked", hint: value.klhReview === "REPORTED" ? "Menunggu persetujuan" : value.klhReview === "NONE" ? "Belum dilaporkan" : "Broadcast disetujui" },
    { label: "Bantuan selesai", state: value.klhReview === "ASSIST_DONE" ? "done" : value.klhReview === "APPROVED" ? "active" : "locked", hint: value.klhReview === "ASSIST_DONE" ? "KLH menyatakan bantuan selesai" : "KLH memantau broadcast" }
  ];
}

export type AgencyReadout = { agency: CaseAgency; label: string; tone: "idle" | "moving" | "waiting" | "done" };

/** Read-only cross-agency status for BNPB/KLHK boards — always derived from real actions, never hand-edited. */
export function agencyReadouts(value: DemoCase): AgencyReadout[] {
  const dlh: AgencyReadout = value.status === "BPBD_REJECTED"
    ? { agency: "DLH", label: "Tidak terlibat — kasus ditolak BPBD", tone: "idle" }
    : value.status === "DETECTED"
      ? { agency: "DLH", label: "Menunggu verifikasi BPBD", tone: "idle" }
      : value.status === "BPBD_VERIFIED"
        ? { agency: "DLH", label: "Menunggu menerima kasus", tone: "waiting" }
        : value.status === "CLOSED"
          ? { agency: "DLH", label: "Pemantauan selesai", tone: "done" }
          : { agency: "DLH", label: value.disseminated ? "Memantau · informasi tersebar" : "Memantau AQI", tone: "moving" };
  const bpbd: AgencyReadout = value.status === "BPBD_REJECTED"
    ? { agency: "BPBD", label: "Menolak — bukan kasus BPBD", tone: "idle" }
    : value.status === "DETECTED"
      ? { agency: "BPBD", label: "Menunggu verifikasi", tone: "waiting" }
      : value.bpbdDone
        ? { agency: "BPBD", label: "Penanganan lapangan selesai", tone: "done" }
        : value.bnpbStage === "HELPING"
          ? { agency: "BPBD", label: "Dibantu BNPB di lapangan", tone: "moving" }
          : value.bnpbStage === "HANDED_OVER"
            ? { agency: "BPBD", label: "Menerima serah kembali BNPB", tone: "moving" }
            : { agency: "BPBD", label: value.status === "BPBD_VERIFIED" ? "Terverifikasi · mempersiapkan" : "Terjun di lapangan", tone: "moving" };
  const bnpb: AgencyReadout = value.bnpbStage === "NONE"
    ? { agency: "BNPB", label: "Tidak dalam penanganan", tone: "idle" }
    : value.bnpbStage === "HELPING"
      ? { agency: "BNPB", label: "Membantu BPBD di lapangan", tone: "moving" }
      : { agency: "BNPB", label: "Serah kembali ke BPBD selesai", tone: "done" };
  const klhk: AgencyReadout = value.klhReview === "NONE"
    ? { agency: "KLHK", label: "Belum dilaporkan", tone: "idle" }
    : value.klhReview === "REPORTED"
      ? { agency: "KLHK", label: "Menunggu persetujuan broadcast", tone: "waiting" }
      : value.klhReview === "APPROVED"
        ? { agency: "KLHK", label: "Broadcast disetujui · memantau", tone: "moving" }
        : { agency: "KLHK", label: "Bantuan selesai", tone: "done" };
  return [dlh, bpbd, bnpb, klhk];
}

export function applyCaseCommand(state: DemoCaseState, command: CaseCommand, at = new Date().toISOString()): DemoCaseState {
  if (!isIsoTimestamp(at)) reject("Waktu demo lokal tidak valid.");
  const actor = requireCaseActor(command.actor);
  if (command.type === "CREATE_CASE") {
    if (actor !== "SIMULATOR") reject("Hanya Simulator yang dapat mengirim kasus baru ke DLH Provinsi.");
    if (!isCaseSource(command.source)) reject("Sumber kasus demo tidak lengkap.");
    if (!isDemoCaseState(state)) reject("Status kasus lokal tidak valid. Reset data demo sebelum melanjutkan.");
    return { ...state, cases: [createCase(command.source, at), ...state.cases] };
  }
  if (!isDemoCaseState(state)) reject("Status kasus lokal tidak valid. Reset data demo sebelum melanjutkan.");
  if (command.type === "MARK_NOTIFICATIONS_SEEN") {
    const visible = new Set(notificationsForRole(state, actor).map((item) => item.id));
    const ids = [...new Set(command.ids)];
    if (!ids.length || ids.some((id) => !visible.has(id))) reject("Notifikasi yang ditandai tidak dikenali untuk peran ini.");
    const seen = { ...state.seen };
    for (const id of ids) seen[id] = [...new Set([...(seen[id] ?? []), actor])];
    return { ...state, seen };
  }
  const current = requireCase(state, command.caseId);
  requireActor(actor, ACTION_ACTOR[command.action]);
  const note = command.note?.trim() ? command.note.trim() : null;
  if (command.action === "CREATE_CASE") reject("Kasus hanya dibuat lewat perintah CREATE_CASE.");
  return withCase(state, { ...transitionCase(current, command.action, at), events: [...current.events, { at, actor, action: command.action, note }] });
}

/**
 * Browser storage and cross-tab messages are untrusted demo input. Replaying
 * each case's own event log proves the stored status came from a legal,
 * forward-only sequence instead of a hand-edited snapshot.
 */
export function replayCaseEvents(id: string, createdAt: string, source: CaseSource, events: unknown): DemoCase | null {
  if (!Array.isArray(events) || !events.length) return null;
  if (!isIsoTimestamp(createdAt) || id !== `kasus-${createdAt}` || !isCaseSource(source)) return null;
  let value: DemoCase | null = null;
  for (const event of events) {
    if (!isRecord(event) || !isIsoTimestamp(event.at) || !isString(event.actor) || !isString(event.action)) return null;
    if (!CASE_AGENCIES.includes(event.actor as CaseAgency) && event.actor !== "SIMULATOR") return null;
    if (!CASE_ACTIONS.includes(event.action as CaseAction)) return null;
    if (event.note !== null && event.note !== undefined && !isString(event.note)) return null;
    const note = typeof event.note === "string" ? event.note : null;
    const actor = event.actor as CaseActor;
    const action = event.action as CaseAction;
    try {
      if (!value) {
        if (action !== "CREATE_CASE" || actor !== "SIMULATOR" || event.at !== createdAt) return null;
        value = createCase(source, createdAt);
      } else {
        requireActor(actor, ACTION_ACTOR[action]);
        value = { ...transitionCase(value, action, event.at), events: [...value.events, { at: event.at, actor, action, note }] };
      }
    } catch { return null; }
  }
  return value;
}

function isCaseSource(value: unknown): value is CaseSource {
  if (!isRecord(value) || !isString(value.classification) || !isRecord(value.region) || !isString(value.region.name) || !isString(value.region.province) || !isString(value.region.slug) || !isRecord(value.observation)) return false;
  return typeof value.observation.aqi === "number" && typeof value.observation.pm25 === "number" && isString(value.observation.wind);
}

function hasCaseShape(value: unknown): value is DemoCase {
  if (!isRecord(value) || !isString(value.id) || !value.id.startsWith("kasus-") || !isIsoTimestamp(value.createdAt) || !isIsoTimestamp(value.updatedAt) || !isCaseSource(value.source)) return false;
  if (!["DETECTED", "BPBD_REJECTED", "BPBD_VERIFIED", "DLH_MONITORING", "INFO_DISSEMINATED", "CLOSED"].includes(String(value.status))) return false;
  if (!["NONE", "REPORTED", "APPROVED", "ASSIST_DONE"].includes(String(value.klhReview))) return false;
  if (!["NONE", "HELPING", "HANDED_OVER"].includes(String(value.bnpbStage))) return false;
  if (typeof value.bpbdDone !== "boolean" || typeof value.disseminated !== "boolean") return false;
  if (value.closedBy !== null && !CASE_AGENCIES.includes(value.closedBy as CaseAgency)) return false;
  if (!Array.isArray(value.events) || !value.events.length) return false;
  return value.events.every((event) => isRecord(event) && isIsoTimestamp(event.at) && isString(event.actor) && isString(event.action) && CASE_ACTIONS.includes(event.action as CaseAction));
}

function sameJsonValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameJsonValue(value, right[index]));
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => Object.hasOwn(right, key) && sameJsonValue(left[key], right[key]));
}

function isSeenMap(value: unknown): value is Record<string, DemoRole[]> {
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([key, roles]) => key.length > 0 && Array.isArray(roles) && roles.every((role) => isString(role) && role !== "WARGA"));
}

export function isDemoCaseState(value: unknown): value is DemoCaseState {
  if (!isRecord(value) || value.version !== DEMO_CASES_VERSION || value.isSynthetic !== true || !Array.isArray(value.cases) || !isSeenMap(value.seen)) return false;
  if (new Set(value.cases.map((item) => (isRecord(item) ? item.id : null))).size !== value.cases.length) return false;
  return value.cases.every((item) => {
    if (!hasCaseShape(item)) return false;
    const replayed = replayCaseEvents(item.id, item.createdAt, item.source, item.events);
    return replayed !== null && sameJsonValue(replayed, item);
  });
}

export function serializeDemoCaseState(state: DemoCaseState): string {
  if (!isDemoCaseState(state)) reject("Status kasus lokal tidak valid dan tidak dapat disimpan.");
  return JSON.stringify(state);
}

export function deserializeDemoCaseState(raw: string | null): DemoCaseState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isDemoCaseState(parsed) ? parsed : null;
  } catch { return null; }
}
