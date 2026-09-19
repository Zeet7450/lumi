import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import {
  ContractValidationError,
  parseBriefInput,
  parseLoginInput,
  parseDemoTelemetryInput,
  parsePublicationDraftInput,
  parseRejectPublicationInput,
  parseSimulationInput,
  parseVersionInput,
  type ApiError,
  type PriorityTier
} from "@lumi/contracts";
import { ApplicationError, forbidden } from "../application/errors.js";
import type { GovernmentService } from "../application/government-service.js";
import type { RuntimeConfig } from "../application/runtime-config.js";
import { publicGuidance } from "../domain/public-guidance.js";

export interface GovernmentHttpServerOptions {
  service: GovernmentService;
  config: RuntimeConfig;
  log?: (entry: Record<string, unknown>) => void;
}

export function createGovernmentHttpServer(options: GovernmentHttpServerOptions) {
  const log = options.log ?? ((entry: Record<string, unknown>) => console.info(JSON.stringify(entry)));
  return createServer(async (request, response) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    let path = "/";
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      path = url.pathname;
      if (isOpsPath(path)) applyOpsCors(request, response, options.config);
      await route(request, response, url, options, requestId);
      log({ requestId, method: request.method, path, status: response.statusCode, durationMs: Date.now() - startedAt });
    } catch (error) {
      writeError(response, requestId, error);
      log({ requestId, method: request.method, path, status: response.statusCode, durationMs: Date.now() - startedAt, errorCategory: error instanceof ApplicationError ? error.code : "INTERNAL_ERROR" });
    }
  });
}

async function route(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  options: GovernmentHttpServerOptions,
  requestId: string
): Promise<void> {
  const method = request.method ?? "GET";
  if (method === "OPTIONS" && isOpsPath(url.pathname)) return handlePreflight(request, response, options.config);
  if (method === "GET" && url.pathname === "/health") return writeJson(response, 200, { status: "ok" });
  if (method === "GET" && url.pathname === "/api/public/guidance") {
    return writePublicJson(response, 200, { guidance: publicGuidance }, "public, max-age=3600");
  }
  const publicRegionMatch = /^\/api\/public\/regions\/([a-z0-9-]+)$/.exec(url.pathname);
  if (method === "GET" && publicRegionMatch) {
    return writePublicJson(response, 200, { projection: options.service.publicProjectionForRegionSlug(publicRegionMatch[1]!) }, "no-cache");
  }
  if (url.pathname.startsWith("/api/public/")) {
    return writeJson(response, 404, { error: { code: "NOT_FOUND", message: "Route tidak ditemukan.", requestId } satisfies ApiError["error"] });
  }

  if (method === "POST" && url.pathname === "/api/ops/login") {
    assertSameOrigin(request, options.config);
    const input = parseLoginInput(await readJson(request));
    const login = options.service.login(input.email, input.password);
    setSessionCookie(response, options.config, login.token, login.expiresAt);
    return writeJson(response, 200, { actor: login.actor, expiresAt: login.expiresAt });
  }
  if (method === "POST" && url.pathname === "/api/ops/logout") {
    assertSameOrigin(request, options.config);
    options.service.logout(readCookie(request, options.config.cookieName));
    clearSessionCookie(response, options.config);
    return writeJson(response, 204, undefined);
  }

  const session = options.service.session(readCookie(request, options.config.cookieName));
  const actor = session.actor;
  if (actor.role === "CITIZEN") throw forbidden();
  if (method !== "GET") assertSameOrigin(request, options.config);

  if (method === "GET" && url.pathname === "/api/ops/session") {
    return writeJson(response, 200, session);
  }

  if (method === "GET" && url.pathname === "/api/ops/incidents") {
    const tier = url.searchParams.get("tier");
    if (tier && !["MONITOR", "VERIFY", "HIGH_RESPONSE"].includes(tier)) throw new ContractValidationError({ tier: "Tier tidak dikenal." });
    const status = url.searchParams.get("status");
    if (status && status !== "OPEN") throw new ContractValidationError({ status: "Status tidak dikenal." });
    return writeJson(response, 200, { incidents: options.service.listIncidents(actor, { tier: tier as PriorityTier | undefined, region: url.searchParams.get("region") ?? undefined, status: status as "OPEN" | undefined }) });
  }

  if (method === "GET" && url.pathname === "/api/ops/dashboard") {
    return writeJson(response, 200, options.service.dashboard(actor));
  }

  if (method === "GET" && url.pathname === "/api/ops/simulator/locations") {
    return writeJson(response, 200, { locations: options.service.listSimulatorLocations(actor) });
  }

  if (method === "POST" && url.pathname === "/api/ops/demo-telemetry") {
    return writeJson(response, 201, options.service.ingestDemoTelemetry(actor, parseDemoTelemetryInput(await readJson(request))));
  }
  if (method === "GET" && url.pathname === "/api/ops/demo-telemetry/history") {
    const rawLimit = url.searchParams.get("limit");
    const limit = rawLimit === null ? 8 : Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new ContractValidationError({ limit: "limit harus bilangan bulat antara 1 dan 20." });
    return writeJson(response, 200, { deliveries: options.service.listDemoTelemetryHistory(actor, limit) });
  }

  const incidentMatch = /^\/api\/ops\/incidents\/([^/]+)(?:\/(brief|publication-draft|submit-publication))?$/.exec(url.pathname);
  if (incidentMatch) {
    const [, incidentId, action] = incidentMatch;
    if (!action && method === "GET") return writeJson(response, 200, options.service.getIncident(actor, incidentId!));
    if (action === "brief" && method === "PATCH") return writeJson(response, 200, options.service.updateBrief(actor, incidentId!, parseBriefInput(await readJson(request))));
    if (action === "publication-draft" && method === "PATCH") return writeJson(response, 200, options.service.savePublicationDraft(actor, incidentId!, parsePublicationDraftInput(await readJson(request))));
    if (action === "submit-publication" && method === "POST") return writeJson(response, 200, options.service.submitPublication(actor, incidentId!, parseVersionInput(await readJson(request))));
  }

  const publicationMatch = /^\/api\/ops\/publications\/([^/]+)\/(approve|reject)$/.exec(url.pathname);
  if (publicationMatch && method === "POST") {
    const [, noticeId, action] = publicationMatch;
    if (action === "approve") return writeJson(response, 200, options.service.approvePublication(actor, noticeId!, parseVersionInput(await readJson(request))));
    return writeJson(response, 200, options.service.rejectPublication(actor, noticeId!, parseRejectPublicationInput(await readJson(request))));
  }

  if (method === "POST" && url.pathname === "/api/ops/simulations") {
    return writeJson(response, 201, options.service.runSimulation(actor, parseSimulationInput(await readJson(request)).preset));
  }
  const simulationMatch = /^\/api\/ops\/simulations\/([^/]+)$/.exec(url.pathname);
  if (method === "GET" && simulationMatch) return writeJson(response, 200, options.service.getSimulation(actor, simulationMatch[1]!));
  if (method === "POST" && url.pathname === "/api/ops/refresh") return writeJson(response, 200, options.service.refreshFixtures(actor));

  writeJson(response, 404, { error: { code: "NOT_FOUND", message: "Route tidak ditemukan.", requestId } satisfies ApiError["error"] });
}

function isAllowedOpsOrigin(origin: string | undefined, config: RuntimeConfig): origin is string {
  return origin === config.opsOrigin || origin === config.simulatorOrigin;
}

function assertSameOrigin(request: IncomingMessage, config: RuntimeConfig): void {
  if (!isAllowedOpsOrigin(request.headers.origin, config)) throw forbidden();
}

function isOpsPath(pathname: string): boolean {
  return pathname.startsWith("/api/ops/");
}

function applyOpsCors(request: IncomingMessage, response: ServerResponse, config: RuntimeConfig): void {
  if (!isAllowedOpsOrigin(request.headers.origin, config)) return;
  response.setHeader("Access-Control-Allow-Origin", request.headers.origin);
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Max-Age", "600");
  response.setHeader("Vary", "Origin");
}

function handlePreflight(request: IncomingMessage, response: ServerResponse, config: RuntimeConfig): void {
  if (!isAllowedOpsOrigin(request.headers.origin, config)) throw forbidden();
  const requestedMethod = request.headers["access-control-request-method"];
  const requestedHeaders = request.headers["access-control-request-headers"];
  if (!requestedMethod || !["GET", "POST", "PATCH"].includes(requestedMethod.toUpperCase())) throw forbidden();
  const headers = (requestedHeaders ?? "").split(",").map((header) => header.trim().toLowerCase()).filter(Boolean);
  if (headers.some((header) => header !== "content-type")) throw forbidden();
  response.statusCode = 204;
  response.setHeader("Cache-Control", "private, no-store");
  response.end();
}

function readCookie(request: IncomingMessage, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  return header.split(/;\s*/).find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 64 * 1024) throw new ContractValidationError({ body: "Payload terlalu besar." });
    chunks.push(bytes);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ContractValidationError({ body: "JSON tidak valid." }); }
}

function setSessionCookie(response: ServerResponse, config: RuntimeConfig, token: string, expiresAt: string): void {
  const attributes = [`${config.cookieName}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Expires=${new Date(expiresAt).toUTCString()}`];
  if (config.secureCookie) attributes.push("Secure");
  response.setHeader("Set-Cookie", attributes.join("; "));
}

function clearSessionCookie(response: ServerResponse, config: RuntimeConfig): void {
  const attributes = [`${config.cookieName}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (config.secureCookie) attributes.push("Secure");
  response.setHeader("Set-Cookie", attributes.join("; "));
}

function writeJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("Cache-Control", "private, no-store");
  if (status === 204) {
    response.end();
    return;
  }
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function writePublicJson(response: ServerResponse, status: number, body: unknown, cacheControl: string): void {
  response.statusCode = status;
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Cache-Control", cacheControl);
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function writeError(response: ServerResponse, requestId: string, error: unknown): void {
  if (error instanceof ContractValidationError) {
    return writeJson(response, 422, { error: { code: "VALIDATION_ERROR", message: error.message, requestId, fields: error.fields } satisfies ApiError["error"] });
  }
  if (error instanceof ApplicationError) {
    const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 409;
    return writeJson(response, status, { error: { code: error.code, message: error.message, requestId } satisfies ApiError["error"] });
  }
  return writeJson(response, 500, { error: { code: "INTERNAL_ERROR", message: "Terjadi gangguan sementara.", requestId } satisfies ApiError["error"] });
}
