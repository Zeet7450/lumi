import { createDemoSystem } from "./application/demo-system.js";
import { loadRuntimeConfig } from "./application/runtime-config.js";
import { createGovernmentHttpServer } from "./http/server.js";

const config = loadRuntimeConfig();
const { service } = createDemoSystem(config.sessionHmacKey, config.demoPasswords);
const server = createGovernmentHttpServer({ service, config });

server.listen(config.port, "127.0.0.1", () => {
  console.info(JSON.stringify({ event: "government_api_started", host: "127.0.0.1", port: config.port, storage: "memory" }));
});
