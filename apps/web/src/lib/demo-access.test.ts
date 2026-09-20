import assert from "node:assert/strict";
import test from "node:test";
import { canRenderInternalDemo, canViewInternalDemo, shouldShowInternalNavigation } from "./demo-access.ts";

test("direct internal demo routes are blocked for Warga while the role selector may still switch roles", () => {
  assert.equal(canViewInternalDemo("WARGA"), false);
  assert.equal(shouldShowInternalNavigation("WARGA"), false);
  assert.equal(canViewInternalDemo("SIMULATOR"), true);
  assert.equal(canViewInternalDemo("DLH"), true);
  assert.equal(canViewInternalDemo("BPBD"), true);
  assert.equal(canViewInternalDemo("APPROVER"), true);
});

test("internal content fails closed until the browser-local role has hydrated", () => {
  assert.equal(canRenderInternalDemo("SIMULATOR", false), false);
  assert.equal(canRenderInternalDemo("WARGA", false), false);
  assert.equal(canRenderInternalDemo("WARGA", true), false);
  assert.equal(canRenderInternalDemo("SIMULATOR", true), true);
});
