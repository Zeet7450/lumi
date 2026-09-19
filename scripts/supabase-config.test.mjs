import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = readFileSync(resolve(root, "supabase/config.toml"), "utf8");

function section(name) {
  const lines = config.split(/\r?\n/u);
  const start = lines.indexOf(`[${name}]`);
  assert.notEqual(start, -1, `Missing [${name}] section`);
  const endOffset = lines.slice(start + 1).findIndex((line) => line.startsWith("["));
  const end = endOffset === -1 ? lines.length : start + 1 + endOffset;
  return lines.slice(start + 1, end).join("\n");
}

test("local Supabase permits only admin-seeded email accounts", () => {
  assert.match(section("auth"), /^enable_signup = false$/mu);
  assert.match(section("auth.email"), /^enable_signup = false$/mu);
});
