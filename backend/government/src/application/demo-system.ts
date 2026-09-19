import { regions } from "../domain/fixtures.js";
import { InMemoryGovernmentRepository } from "../repositories/in-memory-government-repository.js";
import { GovernmentService, type DemoPasswords } from "./government-service.js";

export interface DemoSystemOptions {
  now?: () => string;
}

export function createDemoSystem(sessionHmacKey: string, passwords: DemoPasswords, options?: DemoSystemOptions): {
  service: GovernmentService;
  repository: InMemoryGovernmentRepository;
} {
  const repository = new InMemoryGovernmentRepository(regions);
  const service = new GovernmentService(repository, sessionHmacKey, { now: options?.now ?? (() => new Date().toISOString()) });
  service.seedDemo(passwords);
  return { service, repository };
}
