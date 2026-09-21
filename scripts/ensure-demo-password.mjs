import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rootTarget = resolve(".env.local");
const appTarget = resolve("apps/web/.env.local");

function passwordFrom(environment) {
  const match = environment.match(/^DEMO_PASSWORD=(.*)$/mu);
  if (!match) return null;
  try { return JSON.parse(match[1]); }
  catch { return match[1]; }
}

function withPassword(environment, password) {
  const entry = `DEMO_PASSWORD=${JSON.stringify(password)}`;
  return /^DEMO_PASSWORD=.*$/mu.test(environment)
    ? environment.replace(/^DEMO_PASSWORD=.*$/mu, entry)
    : `${environment}${environment && !environment.endsWith("\n") ? "\n" : ""}${entry}\n`;
}

const rootEnvironment = existsSync(rootTarget) ? readFileSync(rootTarget, "utf8") : "";
const password = passwordFrom(rootEnvironment) ?? `${randomBytes(30).toString("base64url")}Aa1!`;
const nextRootEnvironment = withPassword(rootEnvironment, password);
const appEnvironment = existsSync(appTarget) ? readFileSync(appTarget, "utf8") : "";

writeFileSync(rootTarget, nextRootEnvironment, { encoding: "utf8", mode: 0o600 });
writeFileSync(appTarget, withPassword(appEnvironment, password), { encoding: "utf8", mode: 0o600 });
chmodSync(rootTarget, 0o600);
chmodSync(appTarget, 0o600);
process.stdout.write("Local demo credentials are available in ignored .env.local.\n");
