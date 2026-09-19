import assert from "node:assert/strict";
import test from "node:test";
import { ContractValidationError, aqiFromPm25, parseBriefInput, parseDemoTelemetryInput, parseLoginInput, parseSimulationInput } from "../index.js";

const NON_SECRET_TEST_PASSWORD = "x";

test("login schema accepts an email and normalizes its case", () => {
  assert.deepEqual(
    parseLoginInput({ email: "Operator.DLH@Demo.Lumi.Id", password: NON_SECRET_TEST_PASSWORD }),
    { email: "operator.dlh@demo.lumi.id", password: NON_SECRET_TEST_PASSWORD }
  );
  assert.throws(() => parseLoginInput({ email: "dlh-demo", password: NON_SECRET_TEST_PASSWORD }), ContractValidationError);
});

test("brief schema accepts a bounded, known action", () => {
  const brief = parseBriefInput({
    expectedRevision: 1,
    reviewNote: "Periksa pembaruan data lapangan.",
    actions: [{ actionId: "CHECK_FRESHNESS", owner: "DLH", text: "Periksa data terbaru." }]
  });
  assert.equal(brief.actions[0]?.actionId, "CHECK_FRESHNESS");
});

test("simulation schema rejects an unknown preset", () => {
  assert.throws(() => parseSimulationInput({ preset: "PUBLISH" }), ContractValidationError);
});

test("brief schema rejects an unknown action owner", () => {
  assert.throws(
    () => parseBriefInput({
      expectedRevision: 1,
      reviewNote: "Periksa data.",
      actions: [{ actionId: "CHECK_FRESHNESS", owner: "WARGA", text: "Periksa data terbaru." }]
    }),
    ContractValidationError
  );
});

test("brief schema keeps citizen identities out of operational action ownership", () => {
  assert.throws(
    () => parseBriefInput({
      expectedRevision: 1,
      reviewNote: "Periksa data.",
      actions: [{ actionId: "CHECK_FRESHNESS", owner: "CITIZEN", text: "Periksa data terbaru." }]
    }),
    ContractValidationError
  );
});

test("AQI conversion reports a transparent PM2.5 severity band", () => {
  assert.deepEqual(aqiFromPm25(10), { aqi: 42, band: "GOOD" });
  assert.deepEqual(aqiFromPm25(72), { aqi: 163, band: "UNHEALTHY" });
});

test("demo telemetry requires a catalogue location and bounded non-duplicate hazards", () => {
  const valid = { locationId: "kota-pontianak", aqi: 163, hazards: [{ type: "FIRE", severity: 3 }] };
  assert.equal(parseDemoTelemetryInput(valid).hazards[0]?.severity, 3);
  assert.throws(() => parseDemoTelemetryInput({ ...valid, locationId: undefined }), ContractValidationError);
  assert.throws(() => parseDemoTelemetryInput({ ...valid, hazards: [{ type: "FIRE", severity: 0 }] }), ContractValidationError);
  assert.throws(() => parseDemoTelemetryInput({ ...valid, hazards: [{ type: "FIRE", severity: 6 }] }), ContractValidationError);
  assert.throws(() => parseDemoTelemetryInput({ ...valid, hazards: [{ type: "FIRE", severity: 1 }, { type: "FLOOD", severity: 2 }] }), ContractValidationError);
});
