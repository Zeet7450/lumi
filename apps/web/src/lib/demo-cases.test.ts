import assert from "node:assert/strict";
import test from "node:test";
import { applyCaseCommand, agencyReadouts, caseSourceFromScenario, caseSteps, canCloseCase, deserializeDemoCaseState, initialDemoCaseState, isDemoCaseState, notificationsForRole, pendingResponders, serializeDemoCaseState, unseenNotifications, type CaseCommandInput, type DemoCaseState } from "./demo-cases.ts";
import { applyDemoCommand, initialDemoScenario, type DemoRole } from "./demo-scenario.ts";

const source = {
  classification: "Kebakaran lahan",
  region: { name: "Pontianak", province: "Kalimantan Barat", slug: "pontianak" },
  observation: { aqi: 168, pm25: 74, wind: "Tenggara · 18 km/jam" }
};
const at = (minute: number) => new Date(Date.UTC(2026, 8, 24, 8, minute, 0)).toISOString();
const run = (state: DemoCaseState, role: DemoRole, command: CaseCommandInput, minute: number) => applyCaseCommand(state, { ...command, actor: role } as Parameters<typeof applyCaseCommand>[1], at(minute));
const caseId = (state: DemoCaseState) => state.cases[0]!.id;
const act = (state: DemoCaseState, role: DemoRole, action: string, minute: number) => run(state, role, { type: "CASE_ACTION", caseId: caseId(state), action } as CaseCommandInput, minute);
const created = () => run(initialDemoCaseState(), "SIMULATOR", { type: "CREATE_CASE", source }, 0);

test("the v2 ladder: BPBD verifies, DLH monitors and disseminates, BPBD finishes, DLH closes", () => {
  let state = created();
  assert.equal(state.cases[0]!.status, "DETECTED");
  state = act(state, "BPBD", "BPBD_VERIFY", 5);
  assert.equal(state.cases[0]!.status, "BPBD_VERIFIED");
  state = act(state, "DLH", "DLH_MONITOR", 10);
  assert.equal(state.cases[0]!.status, "DLH_MONITORING");
  assert.throws(() => act(state, "DLH", "DLH_COMPLETE", 12), /Sebar informasi|menunggu BPBD/);
  state = act(state, "DLH", "DISSEMINATE_INFO", 15);
  assert.equal(state.cases[0]!.status, "INFO_DISSEMINATED");
  assert.equal(state.cases[0]!.disseminated, true);
  assert.throws(() => act(state, "DLH", "DLH_COMPLETE", 16), /menunggu BPBD Provinsi/);
  state = act(state, "BPBD", "BPBD_COMPLETE", 20);
  assert.equal(state.cases[0]!.bpbdDone, true);
  assert.equal(state.cases[0]!.status, "INFO_DISSEMINATED", "BPBD finishing must not close the case");
  assert.ok(canCloseCase(state.cases[0]!, "DLH"));
  assert.equal(canCloseCase(state.cases[0]!, "BPBD"), false);
  state = act(state, "DLH", "DLH_COMPLETE", 25);
  assert.equal(state.cases[0]!.status, "CLOSED");
  assert.equal(state.cases[0]!.closedBy, "DLH");
  assert.throws(() => act(state, "DLH", "DLH_COMPLETE", 26), /sudah selesai/);
});

test("BPBD escalates to BNPB, BNPB hands back, then BPBD can finish", () => {
  let state = act(created(), "BPBD", "BPBD_VERIFY", 5);
  state = act(state, "DLH", "DLH_MONITOR", 10);
  state = act(state, "DLH", "DISSEMINATE_INFO", 15);
  state = act(state, "BPBD", "BPBD_REQUEST_HELP", 20);
  assert.equal(state.cases[0]!.bnpbStage, "HELPING");
  assert.throws(() => act(state, "BPBD", "BPBD_COMPLETE", 22), /minta BNPB menyerahkan kembali/);
  state = act(state, "BNPB", "BNPB_HANDOVER", 25);
  assert.equal(state.cases[0]!.bnpbStage, "HANDED_OVER");
  state = act(state, "BPBD", "BPBD_COMPLETE", 30);
  assert.equal(state.cases[0]!.bpbdDone, true);
  state = act(state, "DLH", "DLH_COMPLETE", 35);
  assert.equal(state.cases[0]!.closedBy, "DLH");
});

test("DLH reports to KLH independently; KLH approve and assist-done stay off the BPBD path", () => {
  let state = act(created(), "BPBD", "BPBD_VERIFY", 5);
  state = act(state, "DLH", "DLH_MONITOR", 10);
  state = act(state, "DLH", "DISSEMINATE_INFO", 15);
  state = act(state, "DLH", "DLH_REPORT_KLH", 18);
  assert.equal(state.cases[0]!.klhReview, "REPORTED");
  state = act(state, "KLHK", "KLH_APPROVE", 20);
  assert.equal(state.cases[0]!.klhReview, "APPROVED");
  assert.throws(() => act(state, "KLHK", "KLH_APPROVE", 22), /sudah disetujui/);
  state = act(state, "KLHK", "KLH_ASSIST_DONE", 25);
  assert.equal(state.cases[0]!.klhReview, "ASSIST_DONE");
  assert.equal(state.cases[0]!.status, "INFO_DISSEMINATED", "KLH actions never close the case");
  state = act(state, "BPBD", "BPBD_COMPLETE", 30);
  state = act(state, "DLH", "DLH_COMPLETE", 35);
  assert.equal(state.cases[0]!.closedBy, "DLH");
});

test("a rejected case is terminal and never reaches DLH or KLH", () => {
  let state = act(created(), "BPBD", "BPBD_REJECT", 5);
  assert.equal(state.cases[0]!.status, "BPBD_REJECTED");
  assert.equal(notificationsForRole(state, "KLHK").length, 0);
  assert.throws(() => act(state, "BPBD", "BPBD_VERIFY", 6), /sudah selesai/);
  assert.throws(() => act(state, "DLH", "DLH_MONITOR", 6), /sudah selesai/);
});

test("role boundaries and unverified shortcuts are rejected at the command edge", () => {
  const state = created();
  assert.throws(() => run(state, "DLH", { type: "CREATE_CASE", source }, 1), /Hanya Simulator/);
  assert.throws(() => act(state, "DLH", "DLH_MONITOR", 2), /belum tersedia/);
  assert.throws(() => act(state, "KLHK", "BPBD_VERIFY", 2), /hanya untuk BPBD/);
  assert.throws(() => act(state, "KLHK", "KLH_APPROVE", 2), /belum dilaporkan ke KLH/);
  assert.throws(() => run(state, "WARGA", { type: "CREATE_CASE", source }, 2), /Warga/);
  assert.throws(() => act(state, "DLH", "BBQ", 2), /BBQ|tidak dapat/);
});

test("notifications are per-role, become history once seen, and never invent recipients", () => {
  let state = created();
  const bpbdInbox = unseenNotifications(state, "BPBD");
  assert.equal(bpbdInbox.length, 1);
  assert.equal(unseenNotifications(state, "KLHK").length, 0);
  const id = bpbdInbox[0]!.id;
  assert.throws(() => run(state, "DLH", { type: "MARK_NOTIFICATIONS_SEEN", ids: [id] }, 3), /tidak dikenali/);
  state = run(state, "BPBD", { type: "MARK_NOTIFICATIONS_SEEN", ids: [id] }, 4);
  assert.equal(unseenNotifications(state, "BPBD").length, 0);
  assert.equal(notificationsForRole(state, "BPBD").find((item) => item.id === id)?.seen, true);
  state = act(state, "BPBD", "BPBD_VERIFY", 5);
  assert.deepEqual(unseenNotifications(state, "DLH").map((item) => item.title), ["Kasus terverifikasi BPBD Provinsi"]);
  assert.deepEqual(unseenNotifications(state, "KLHK").map((item) => item.title), ["Kasus terverifikasi BPBD Provinsi"]);
});

test("pending responders expose non-response instead of hiding it", () => {
  let state = created();
  assert.deepEqual(pendingResponders(state).map((item) => item.agency), ["BPBD"]);
  state = act(state, "BPBD", "BPBD_VERIFY", 5);
  assert.deepEqual(pendingResponders(state).map((item) => item.agency), ["DLH"]);
  state = act(state, "DLH", "DLH_MONITOR", 10);
  assert.deepEqual(pendingResponders(state).map((item) => item.agency), ["DLH"]);
  state = act(state, "DLH", "DISSEMINATE_INFO", 15);
  assert.deepEqual(pendingResponders(state).map((item) => item.agency).sort(), ["BPBD"]);
  state = act(state, "BPBD", "BPBD_REQUEST_HELP", 20);
  assert.deepEqual(pendingResponders(state).map((item) => item.agency).sort(), ["BNPB", "BPBD"]);
  state = act(state, "BNPB", "BNPB_HANDOVER", 25);
  state = act(state, "BPBD", "BPBD_COMPLETE", 30);
  assert.deepEqual(pendingResponders(state).map((item) => item.agency), ["DLH"]);
});

test("cross-agency readouts follow real actions across both parallel tracks", () => {
  let state = act(created(), "BPBD", "BPBD_VERIFY", 5);
  state = act(state, "DLH", "DLH_MONITOR", 10);
  state = act(state, "DLH", "DISSEMINATE_INFO", 15);
  state = act(state, "BPBD", "BPBD_REQUEST_HELP", 20);
  assert.equal(agencyReadouts(state.cases[0]!).find((item) => item.agency === "BNPB")?.label, "Membantu BPBD di lapangan");
  state = act(state, "BNPB", "BNPB_HANDOVER", 25);
  assert.equal(agencyReadouts(state.cases[0]!).find((item) => item.agency === "BNPB")?.label, "Serah kembali ke BPBD selesai");
  state = act(state, "DLH", "DLH_REPORT_KLH", 28);
  state = act(state, "KLHK", "KLH_APPROVE", 30);
  assert.equal(agencyReadouts(state.cases[0]!).find((item) => item.agency === "KLHK")?.label, "Broadcast disetujui · memantau");
});

test("steppers are ordered, forward-only, and DLH owns the closure", () => {
  let state = created();
  const field = caseSteps(state.cases[0]!, "FIELD");
  assert.deepEqual(field.map((step) => step.state), ["done", "active", "locked", "locked", "locked", "locked"]);
  state = act(state, "BPBD", "BPBD_VERIFY", 5);
  assert.deepEqual(caseSteps(state.cases[0]!, "FIELD").map((step) => step.state), ["done", "done", "active", "locked", "locked", "locked"]);
  state = act(state, "DLH", "DLH_MONITOR", 10);
  state = act(state, "DLH", "DISSEMINATE_INFO", 15);
  assert.deepEqual(caseSteps(state.cases[0]!, "FIELD").map((step) => step.state), ["done", "done", "done", "done", "active", "locked"]);
  state = act(state, "BPBD", "BPBD_COMPLETE", 20);
  assert.equal(caseSteps(state.cases[0]!, "FIELD").at(-1)?.state, "active");
  assert.equal(caseSteps(state.cases[0]!, "FIELD").at(-1)?.hint, "DLH pemegang penutupan akhir");
  state = act(state, "DLH", "DLH_COMPLETE", 25);
  assert.equal(caseSteps(state.cases[0]!, "FIELD").at(-1)?.state, "done");
});

test("stored state must replay from its own event log before it is trusted", () => {
  let state = act(created(), "BPBD", "BPBD_VERIFY", 5);
  state = act(state, "DLH", "DLH_MONITOR", 10);
  const raw = serializeDemoCaseState(state);
  assert.deepEqual(deserializeDemoCaseState(raw), state);
  const tampered = JSON.parse(raw) as { cases: Array<{ status: string }> };
  tampered.cases[0]!.status = "CLOSED";
  assert.equal(deserializeDemoCaseState(JSON.stringify(tampered)), null);
  assert.equal(isDemoCaseState({ version: 1, isSynthetic: true, cases: [], seen: { "kasus-x:0": ["WARGA"] } }), false);
  assert.equal(deserializeDemoCaseState("{"), null);
});

test("a scenario observation becomes the case source snapshot", () => {
  const scenario = applyDemoCommand(initialDemoScenario(), { type: "CREATE_SCENARIO", actor: "SIMULATOR" }, at(0));
  const snapshot = caseSourceFromScenario(scenario);
  assert.equal(snapshot.classification, "Kebakaran lahan");
  assert.equal(snapshot.region.slug, "pontianak");
  assert.equal(snapshot.observation.aqi, scenario.observation?.aqi);
});
