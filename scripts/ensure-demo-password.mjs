import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const target = resolve(".env.local");
const current = existsSync(target) ? readFileSync(target, "utf8") : "";
if (!/^DEMO_PASSWORD=/mu.test(current)) {
  const password = `${randomBytes(30).toString("base64url")}Aa1!`;
  writeFileSync(target, `${current}${current && !current.endsWith("\n") ? "\n" : ""}DEMO_PASSWORD=${JSON.stringify(password)}\n`, { encoding: "utf8", mode: 0o600 });
}
chmodSync(target, 0o600);
process.stdout.write("Local demo credentials are available in ignored .env.local.\n");
