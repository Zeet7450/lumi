import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../application/security.js";

test("password verification fails safely for malformed stored hashes", () => {
  const stored = hashPassword("correct-demo-password", "0123456789abcdef0123456789abcdef");
  assert.equal(verifyPassword("correct-demo-password", stored), true);
  assert.equal(verifyPassword("wrong-demo-password", stored), false);
  assert.equal(verifyPassword("correct-demo-password", "scrypt$short$not-a-valid-derived-key"), false);
});
