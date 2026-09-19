export type Tier = "MONITOR" | "VERIFY" | "HIGH_RESPONSE";
export type Freshness = "FRESH" | "STALE" | "UNAVAILABLE";
export type Role = "DLH" | "BPBD" | "DINKES" | "DISKOMINFO" | "ADMIN_DEMO";

export type PublicProjection = {
  region: { slug: string; name: string; province: string };
  notice: {
    tier: Tier;
    text: string;
    publishedAt: string;
    dataObservedAt: string | null;
    currentFreshness: Freshness;
    sources: string[];
  };
};

export type IncidentSummary = {
  id: string;
  region: { slug: string; name: string; province: string };
  tier: Tier;
  workflowStatus: "OPEN" | "RESOLVED";
  rationale: string[];
  freshness: Freshness;
};

export type DashboardData = {
  updatedAt: string | null;
  kpis: { monitoredRegions: number; highResponse: number; verification: number; openIncidents: number };
  regions: Array<{ slug: string; name: string; province: string; pm25: number | null; aqi: number | null; tier: Tier | null; freshness: Freshness; observedAt: string | null }>;
  trend: Array<{ observedAt: string; pm25: number; regionSlug: string }>;
  mapPoints: Array<{ id: string; name: string; provinceSlug: string; province: string; city: string; district: string; village: string; latitude: number; longitude: number; radiusKm: number; pm25: number | null; aqi: number | null; tier: Tier | null; observedAt: string | null; hazards: Array<{ type: string; severity: number }>; administrativeBoundary: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][]; source: "Geoapify administrative boundary" } | null; boundaryStatus: "UNAVAILABLE" }>;
};

export type DemoDelivery = {
  id: string;
  receivedAt: string;
  locationName: string;
  aqi: number;
  status: "ACCEPTED";
};

export type DemoTelemetryInput = {
  locationId: string;
  aqi: number;
  hazards: Array<{ type: "FIRE" | "VOLCANIC_ASH" | "FLOOD"; severity: number }>;
};

export type SimulatorLocation = { id: string; provinceSlug: string; province: string; name: string; city: string };

export type Actor = { userId: string; role: Role };
type LoginActor = Actor | { userId: string; role: "CITIZEN" };

const fallbackPublic: PublicProjection = {
  region: { slug: "pontianak", name: "Pontianak", province: "Kalimantan Barat" },
  notice: {
    tier: "HIGH_RESPONSE",
    text: "Kualitas udara sedang memburuk. Kurangi aktivitas di luar ruangan, gunakan masker bila perlu keluar, dan utamakan perlindungan anak-anak serta lansia.",
    publishedAt: new Date().toISOString(),
    dataObservedAt: new Date().toISOString(),
    currentFreshness: "FRESH",
    sources: ["LUMI", "BMKG"]
  }
};

const fallbackIncidents: IncidentSummary[] = [
  { id: "preview-pontianak", region: fallbackPublic.region, tier: "HIGH_RESPONSE", workflowStatus: "OPEN", freshness: "FRESH", rationale: ["PM2.5 meningkat", "Arah angin mendukung dampak", "Indikasi anomali panas perlu verifikasi"] },
  { id: "preview-kalteng", region: { slug: "kalteng", name: "Palangka Raya", province: "Kalimantan Tengah" }, tier: "VERIFY", workflowStatus: "OPEN", freshness: "FRESH", rationale: ["Perlu cek lapangan sebelum respons ditingkatkan"] }
];

const apiOrigin = process.env.NEXT_PUBLIC_LUMI_API_ORIGIN ?? "http://localhost:4000";

export function formatTime(value: string | null | undefined): string {
  if (!value) return "Belum tersedia";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)).replace(".", ":") + " WIB";
}

export function tierLabel(tier: Tier): string {
  return tier === "HIGH_RESPONSE" ? "Respons Tinggi" : tier === "VERIFY" ? "Verifikasi" : "Pantau";
}

export function freshnessLabel(value: Freshness): string {
  return value === "FRESH" ? "Data terkini" : value === "STALE" ? "Data perlu diperbarui" : "Data tidak tersedia";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = init?.body ? { "Content-Type": "application/json", ...(init.headers ?? {}) } : init?.headers;
  const response = await fetch(`${apiOrigin}${path}`, { credentials: "include", ...init, headers });
  if (!response.ok) throw new Error(String(response.status));
  return response.json() as Promise<T>;
}

export async function getPublicRegion(slug: string): Promise<{ projection: PublicProjection | null; preview: boolean }> {
  try { return { ...(await request<{ projection: PublicProjection | null }>(`/api/public/regions/${slug}`, { credentials: "omit" })), preview: false }; }
  catch { return { projection: fallbackPublic, preview: true }; }
}

export async function getIncidents(): Promise<{ incidents: IncidentSummary[]; preview: boolean }> {
  try { return { ...(await request<{ incidents: IncidentSummary[] }>("/api/ops/incidents")), preview: false }; }
  catch { return { incidents: fallbackIncidents, preview: true }; }
}

export async function getDashboard(): Promise<DashboardData> {
  return request<DashboardData>("/api/ops/dashboard");
}

export async function sendDemoTelemetry(input: DemoTelemetryInput): Promise<Pick<DemoDelivery, "id" | "receivedAt" | "status">> {
  return request<Pick<DemoDelivery, "id" | "receivedAt" | "status">>("/api/ops/demo-telemetry", { method: "POST", body: JSON.stringify(input) });
}

export async function getDemoTelemetryHistory(): Promise<DemoDelivery[]> {
  const result = await request<{ deliveries: DemoDelivery[] }>("/api/ops/demo-telemetry/history?limit=8");
  return result.deliveries;
}

export async function getSimulatorLocations(): Promise<SimulatorLocation[]> {
  const result = await request<{ locations: SimulatorLocation[] }>("/api/ops/simulator/locations");
  return result.locations;
}

export async function getOpsSession(): Promise<Actor | null> {
  try {
    const session = await request<{ actor: Actor }>("/api/ops/session");
    return session.actor;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await request<undefined>("/api/ops/logout", { method: "POST" });
}

export async function login(email: string, password: string): Promise<{ actor: Actor; preview: boolean }> {
  try {
    const session = await request<{ actor: LoginActor }>("/api/ops/login", { method: "POST", body: JSON.stringify({ email, password }) });
    const actor = session.actor;
    if (actor.role === "CITIZEN") throw new Error("Akun warga memakai portal publik dan tidak memiliki akses ke LUMI Ops.");
    return { actor, preview: false };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Akun warga")) throw error;
    if (String(error).includes("401")) throw new Error("Email demo atau kata sandi tidak sesuai.");
    const role = (email.startsWith("koordinator.bpbd") ? "BPBD" : email.startsWith("approver.diskominfo") ? "DISKOMINFO" : email.startsWith("simulator") ? "ADMIN_DEMO" : "DLH") as Role;
    return { actor: { userId: "preview-user", role }, preview: true };
  }
}

export async function runSimulation(preset: "MONITOR" | "VERIFY" | "HIGH_PONTIANAK" | "STALE") {
  return request<{ id: string; preset: string; output: { kind: string; tier?: Tier; rationale?: string[]; dataGaps?: string[] } }>("/api/ops/simulations", { method: "POST", body: JSON.stringify({ preset }) });
}
