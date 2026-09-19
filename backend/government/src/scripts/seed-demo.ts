import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type User } from "@supabase/supabase-js";
import { demoLocations } from "../domain/demo-locations.js";

type DemoRole = "DLH" | "BPBD" | "DISKOMINFO" | "ADMIN_DEMO" | "CITIZEN";

interface DemoAccount {
  email: string;
  role: DemoRole;
  displayName: string;
  organization: string;
  jobTitle: string;
  regionSlug: string;
}

const accounts: readonly DemoAccount[] = [
  {
    email: "operator.dlh@demo.lumi.id",
    role: "DLH",
    displayName: "Operator DLH",
    organization: "DLH Kota Pontianak",
    jobTitle: "Operator & Validator Kualitas Udara",
    regionSlug: "pontianak",
  },
  {
    email: "koordinator.bpbd@demo.lumi.id",
    role: "BPBD",
    displayName: "Koordinator BPBD",
    organization: "BPBD Kota Palangka Raya",
    jobTitle: "Koordinator Respons Risiko",
    regionSlug: "kalteng",
  },
  {
    email: "approver.diskominfo@demo.lumi.id",
    role: "DISKOMINFO",
    displayName: "Approver Diskominfo",
    organization: "Diskominfo Kalimantan",
    jobTitle: "Approver Informasi Publik",
    regionSlug: "kalteng",
  },
  {
    email: "simulator@demo.lumi.id",
    role: "ADMIN_DEMO",
    displayName: "Administrator Simulator",
    organization: "LUMI Simulation Center",
    jobTitle: "Administrator Simulation Center",
    regionSlug: "kalteng",
  },
  {
    email: "amelia.warga@demo.lumi.id",
    role: "CITIZEN",
    displayName: "Amelia",
    organization: "Warga Demo LUMI",
    jobTitle: "Warga",
    regionSlug: "kalteng",
  },
] as const;

function parseEnv(source: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u.exec(line);
    if (!match) continue;
    let value = match[2];
    if (value.startsWith('"') && value.endsWith('"')) value = JSON.parse(value) as string;
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    values.set(match[1], value);
  }
  return values;
}

function loadEnvironment(): Map<string, string> {
  const values = parseEnv(readFileSync(resolve(process.cwd(), ".env.local"), "utf8"));
  for (const [key, value] of Object.entries(process.env)) {
    if (value) values.set(key, value);
  }
  return values;
}

function required(values: Map<string, string>, key: string): string {
  const value = values.get(key);
  if (!value) throw new Error(`${key} is required. Run pnpm setup:local-env first.`);
  return value;
}

function assertLocalUrl(value: string): void {
  const url = new URL(value);
  if (!(["127.0.0.1", "localhost"].includes(url.hostname) && url.protocol === "http:")) {
    throw new Error("Demo seeding is restricted to the local Supabase stack.");
  }
}

async function main(): Promise<void> {
  const env = loadEnvironment();
  const url = required(env, "SUPABASE_URL");
  assertLocalUrl(url);
  const secretKey = required(env, "SUPABASE_SECRET_KEY");
  const publishableKey = required(env, "SUPABASE_PUBLISHABLE_KEY");
  const password = required(env, "DEMO_PASSWORD");

  const admin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const regionRows = demoLocations.map((location) => ({
    slug: location.regionSlug,
    province_slug: location.provinceSlug,
    province_name: location.province,
    administrative_name: location.city,
    display_name: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    catalogue_source: "LUMI curated Kalimantan catalogue",
  }));
  const { error: regionsError } = await admin.from("regions").upsert(regionRows, { onConflict: "slug" });
  if (regionsError) throw new Error(`Unable to seed local regions: ${regionsError.message}`);

  const { error: templateError } = await admin.from("scenario_templates").upsert(
    {
      slug: "kebakaran-lahan-kabut-asap-kalimantan",
      name: "Kebakaran Lahan dan Kabut Asap Kalimantan",
      scenario_type: "LAND_FIRE_HAZE",
      description: "Skenario sintetis untuk latihan validasi dampak udara, respons BPBD, dan persetujuan informasi publik.",
      default_parameters: {
        source_region_slug: "kalteng",
        fire_intensity: 3,
        wind_direction_degrees: 135,
        wind_speed_kmh: 15,
        aqi: 175,
        pm25: 95,
        pollutant_basis: "PM25",
        citizen_report_count: 1,
        simulation_speed: 1,
      },
      timeline: [
        { offset_seconds: 0, event: "SYNTHETIC_HOTSPOT_RECEIVED" },
        { offset_seconds: 15, event: "SYNTHETIC_CITIZEN_REPORT_RECEIVED" },
        { offset_seconds: 30, event: "WAIT_FOR_BPBD_VERIFICATION" },
        { offset_seconds: 45, event: "WAIT_FOR_DLH_VALIDATION" },
        { offset_seconds: 60, event: "WAIT_FOR_BPBD_ACTION_AND_DRAFT" },
        { offset_seconds: 75, event: "WAIT_FOR_HUMAN_APPROVAL" },
        { offset_seconds: 90, event: "SCENARIO_CONDITION_UPDATE" },
      ],
      synthetic_label: "SIMULATION MODE — Data uji, bukan kondisi nyata.",
      is_active: true,
      is_synthetic: true,
    },
    { onConflict: "slug" },
  );
  if (templateError) throw new Error(`Unable to seed the local scenario template: ${templateError.message}`);

  const existingUsers: User[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 50 });
    if (error) throw new Error(`Unable to list local Auth users: ${error.message}`);
    existingUsers.push(...data.users);
    if (data.users.length < 50) break;
  }
  const usersByEmail = new Map(existingUsers.map((user) => [user.email?.toLowerCase(), user]));
  const seededUsers: Array<{ user: User; account: DemoAccount }> = [];

  for (const account of accounts) {
    const existing = usersByEmail.get(account.email);
    if (existing) {
      const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        app_metadata: { role: account.role },
        user_metadata: { display_name: account.displayName },
      });
      if (error) throw new Error(`Unable to reconcile local demo account ${account.email}: ${error.message}`);
      seededUsers.push({ user: data.user, account });
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      app_metadata: { role: account.role },
      user_metadata: { display_name: account.displayName },
    });
    if (error) throw new Error(`Unable to create local demo account ${account.email}: ${error.message}`);
    seededUsers.push({ user: data.user, account });
  }

  const { data: regions, error: regionLookupError } = await admin.from("regions").select("id,slug");
  if (regionLookupError) throw new Error(`Unable to resolve seeded regions: ${regionLookupError.message}`);
  const regionIds = new Map((regions ?? []).map((region) => [region.slug as string, region.id as string]));
  const profileRows = seededUsers.map(({ user, account }) => ({
    id: user.id,
    email: account.email,
    display_name: account.displayName,
    organization: account.organization,
    job_title: account.jobTitle,
    role: account.role,
    region_id: regionIds.get(account.regionSlug) ?? null,
  }));
  if (profileRows.some((profile) => profile.region_id === null)) {
    throw new Error("A demo profile references a missing local Kalimantan region.");
  }
  const { error: profileError } = await admin.from("profiles").upsert(profileRows, { onConflict: "id" });
  if (profileError) throw new Error(`Unable to seed local profiles: ${profileError.message}`);

  for (const account of accounts) {
    const verificationClient = createClient(url, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await verificationClient.auth.signInWithPassword({ email: account.email, password });
    if (error) throw new Error(`Local sign-in verification failed for ${account.email}: ${error.message}`);
    await verificationClient.auth.signOut();
  }

  process.stdout.write(
    `Seeded ${regionRows.length} Kalimantan regions, one synthetic scenario template, and ${accounts.length} verified demo accounts.\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown local seed failure.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
