import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const children = [];
const launch = (command, args, env) => {
  const child = spawn(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: "inherit" });
  children.push(child);
  child.on("exit", (code) => { if (code && !shuttingDown) process.exitCode = code; });
};
let shuttingDown = false;
const stop = () => { shuttingDown = true; for (const child of children) child.kill("SIGTERM"); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);

launch(process.execPath, ["scripts/local-demo-state-service.mjs"], {});
launch("pnpm", ["--filter", "@lumi/government", "build"], {});
launch("pnpm", ["--filter", "@lumi/government", "start:local"], {});
launch("pnpm", ["--filter", "@lumi/web", "dev", "--hostname", "127.0.0.1", "--port", "3000"], { LUMI_ENTRY: "ops", LUMI_DIST_DIR: ".next-ops" });
launch("pnpm", ["--filter", "@lumi/web", "dev", "--hostname", "127.0.0.1", "--port", "3001"], { LUMI_ENTRY: "warga", LUMI_DIST_DIR: ".next-warga" });
