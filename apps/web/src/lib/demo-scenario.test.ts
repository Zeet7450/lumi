import assert from "node:assert/strict";
import test from "node:test";
import { applyDemoCommand, deserializeDemoScenario, initialDemoScenario, isDemoScenario, projectDemoMap, projectPublicDemoNotice, replayDemoScenarioEvents, serializeDemoScenario } from "./demo-scenario.ts";

const at = "2026-09-20T08:00:00.000Z";
const command = (state: ReturnType<typeof initialDemoScenario>, type: Parameters<typeof applyDemoCommand>[1]["type"], actor: Parameters<typeof applyDemoCommand>[1]["actor"]) => applyDemoCommand(state, { type, actor } as Parameters<typeof applyDemoCommand>[1], at);

test("synthetic workflow only advances through the accountable role order", () => {
  let state = initialDemoScenario();
  state = command(state, "CREATE_SCENARIO", "SIMULATOR");
  state = command(state, "VALIDATE_ENVIRONMENT", "DLH");
  state = command(state, "VERIFY_INCIDENT", "BPBD");
  state = command(state, "RECORD_RESPONSE", "BPBD");
  state = command(state, "PUBLISH_NOTICE", "APPROVER");
  assert.equal(state.workflow, "PUBLISHED");
  assert.equal(state.isSynthetic, true);
  assert.equal(state.notice?.approvedBy, "APPROVER");
});

test("wrong roles and early publishing are rejected at the command boundary", () => {
  const state = initialDemoScenario();
  assert.throws(() => command(state, "CREATE_SCENARIO", "DLH"), /SIMULATOR/);
  assert.throws(() => command(state, "PUBLISH_NOTICE", "APPROVER"), /Status saat ini/);
  const created = command(state, "CREATE_SCENARIO", "SIMULATOR");
  assert.throws(() => command(created, "VERIFY_INCIDENT", "DLH"), /BPBD/);
  assert.throws(() => command(created, "PUBLISH_NOTICE", "APPROVER"), /Status saat ini/);
  assert.throws(() => command(created, "RESET_SCENARIO", "BPBD"), /SIMULATOR/);
});

test("public projection excludes drafts and all internal operational state", () => {
  let state = initialDemoScenario();
  state = command(state, "CREATE_SCENARIO", "SIMULATOR");
  state = command(state, "VALIDATE_ENVIRONMENT", "DLH");
  state = command(state, "VERIFY_INCIDENT", "BPBD");
  state = command(state, "RECORD_RESPONSE", "BPBD");
  assert.equal(projectPublicDemoNotice(state), null);
  state = command(state, "PUBLISH_NOTICE", "APPROVER");
  const projection = projectPublicDemoNotice(state);
  assert.deepEqual(Object.keys(projection ?? {}).sort(), ["notice", "region"]);
  assert.equal("response" in (projection ?? {}), false);
});

test("serialization rehydrates only valid synthetic states", () => {
  const state = command(initialDemoScenario(), "CREATE_SCENARIO", "SIMULATOR");
  assert.deepEqual(deserializeDemoScenario(serializeDemoScenario(state)), state);
  assert.equal(deserializeDemoScenario('{"isSynthetic":false}'), null);
  assert.equal(deserializeDemoScenario("not-json"), null);
  assert.equal(deserializeDemoScenario(JSON.stringify({ ...state, isSynthetic: false })), null);
  assert.equal(deserializeDemoScenario(JSON.stringify({ ...state, workflow: "PUBLISHED" })), null);
  assert.equal(isDemoScenario(state), true);
});

test("rehydration rejects a forged published snapshot and a missing accountable history", () => {
  let state = initialDemoScenario();
  state = command(state, "CREATE_SCENARIO", "SIMULATOR");
  state = command(state, "VALIDATE_ENVIRONMENT", "DLH");
  state = command(state, "VERIFY_INCIDENT", "BPBD");
  state = command(state, "RECORD_RESPONSE", "BPBD");
  const forged = {
    ...state,
    workflow: "PUBLISHED",
    notice: { ...state.notice!, status: "PUBLISHED", approvedBy: "APPROVER", publishedAt: at }
  };
  assert.equal(deserializeDemoScenario(JSON.stringify(forged)), null);

  const missingHistory = { ...forged, events: forged.events.slice(0, 2) };
  assert.equal(deserializeDemoScenario(JSON.stringify(missingHistory)), null);
});

test("event replay rejects wrong actors and out-of-order transitions from channel payloads", () => {
  const invalidActor = [{ at, actor: "DLH", command: "CREATE_SCENARIO" }];
  assert.equal(replayDemoScenarioEvents(invalidActor), null);

  const skippedValidation = [
    { at, actor: "SIMULATOR", command: "CREATE_SCENARIO" },
    { at: "2026-09-20T08:01:00.000Z", actor: "BPBD", command: "VERIFY_INCIDENT" }
  ];
  assert.equal(replayDemoScenarioEvents(skippedValidation), null);
});

test("reset always returns the deterministic empty synthetic scenario", () => {
  const reset = command(command(initialDemoScenario(), "CREATE_SCENARIO", "SIMULATOR"), "RESET_SCENARIO", "SIMULATOR");
  assert.deepEqual(reset, initialDemoScenario());
});

test("simulator controls update the replayable synthetic scenario and its shared map data", () => {
  let state = initialDemoScenario();
  state = applyDemoCommand(state, { type: "SET_WIND_DIRECTION", actor: "SIMULATOR", windDirection: "Barat" }, at);
  state = applyDemoCommand(state, { type: "SET_WIND_SPEED", actor: "SIMULATOR", windSpeed: 28 }, at);
  state = applyDemoCommand(state, { type: "SET_FIRE_INTENSITY", actor: "SIMULATOR", fireIntensity: 5 }, at);
  state = command(state, "CREATE_SCENARIO", "SIMULATOR");
  const activeMap = projectDemoMap(state);
  assert.equal(state.simulation.isPlaying, true);
  assert.equal(state.observation?.wind, "Barat · 28 km/jam");
  assert.equal(activeMap.fireIntensity, 5);
  assert.equal(activeMap.hazeRadiusMeters, 15_000);
  assert.notDeepEqual(activeMap.fire, activeMap.windEnd);

  state = command(state, "PAUSE_SIMULATION", "SIMULATOR");
  assert.equal(state.simulation.isPlaying, false);
  state = command(state, "PLAY_SIMULATION", "SIMULATOR");
  assert.equal(state.simulation.isPlaying, true);
  assert.deepEqual(deserializeDemoScenario(serializeDemoScenario(state)), state);
});

test("wind speed is a free number clamped to 0-100 and AQI override flows to observation", () => {
  let state = initialDemoScenario();
  state = applyDemoCommand(state, { type: "SET_WIND_SPEED", actor: "SIMULATOR", windSpeed: 64 }, at);
  assert.equal(state.simulation.windSpeed, 64);
  state = applyDemoCommand(state, { type: "SET_WIND_SPEED", actor: "SIMULATOR", windSpeed: 500 }, at);
  assert.equal(state.simulation.windSpeed, 100, "wind above 100 clamps to 100");
  state = applyDemoCommand(state, { type: "SET_AQI", actor: "SIMULATOR", aqi: 231 }, at);
  assert.equal(state.simulation.aqiOverride, 231);
  state = applyDemoCommand(state, { type: "SET_AQI", actor: "SIMULATOR", aqi: null }, at);
  assert.equal(state.simulation.aqiOverride, null, "null clears the override");
  assert.throws(() => applyDemoCommand(state, { type: "SET_WIND_SPEED", actor: "SIMULATOR", windSpeed: -4 }, at), /0–100/);
  assert.throws(() => applyDemoCommand(state, { type: "SET_AQI", actor: "SIMULATOR", aqi: 900 }, at), /0–500/);
});

test("incident classification names the simulator-chosen event", () => {
  const started = applyDemoCommand(initialDemoScenario(), { type: "CREATE_SCENARIO", actor: "SIMULATOR" }, at);
  const base = applyDemoCommand(started, { type: "SET_SOURCES", actor: "SIMULATOR", sources: [{ id: "sumber-1", sourcePointId: "pontianak-utara", eventType: "HAZE", customName: "", radiusMeters: 15_000, windDirection: "Tenggara", windSpeed: 30, intensity: 3, isPlaying: true, updatedAt: null }] }, at);
  assert.equal(base.simulation.fireHazeStatus, "HAZE");
  assert.equal(base.simulation.windSpeed, 30, "free wind speed survives SET_SOURCES");
  const verified = applyDemoCommand(base, { type: "VALIDATE_ENVIRONMENT", actor: "DLH" }, at);
  const classified = applyDemoCommand(verified, { type: "VERIFY_INCIDENT", actor: "BPBD" }, at);
  assert.match(classified.incident!.classification, /Pencemaran\/kabut asap/);
  const custom = applyDemoCommand(applyDemoCommand(applyDemoCommand(initialDemoScenario(), { type: "CREATE_SCENARIO", actor: "SIMULATOR" }, at), { type: "SET_SOURCES", actor: "SIMULATOR", sources: [{ id: "sumber-1", sourcePointId: "pontianak-utara", eventType: "CUSTOM", customName: "Ledakan gas Pelabuhan", radiusMeters: 12_000, windDirection: "Barat", windSpeed: 45, intensity: 4, isPlaying: true, updatedAt: null }] }, at), { type: "VALIDATE_ENVIRONMENT", actor: "DLH" }, at);
  const classifiedCustom = applyDemoCommand(custom, { type: "VERIFY_INCIDENT", actor: "BPBD" }, at);
  assert.match(classifiedCustom.incident!.classification, /Ledakan gas Pelabuhan/);
});

test("only Simulator can alter pre-validation controls", () => {
  const state = initialDemoScenario();
  assert.throws(() => applyDemoCommand(state, { type: "SET_WIND_SPEED", actor: "DLH", windSpeed: 28 }, at), /SIMULATOR/);
  const validated = command(command(initialDemoScenario(), "CREATE_SCENARIO", "SIMULATOR"), "VALIDATE_ENVIRONMENT", "DLH");
  assert.throws(() => applyDemoCommand(validated, { type: "SET_FIRE_INTENSITY", actor: "SIMULATOR", fireIntensity: 5 }, at), /sebelum validasi DLH/);
});
