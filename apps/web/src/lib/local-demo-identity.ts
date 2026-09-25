import type { DemoRole } from "./demo-scenario";

export type DemoAccount = { email: string; role: DemoRole; destination: string; label: string; province?: string };

/** The five Kalimantan provinces the provincial demo accounts cover today. */
export const KALIMANTAN_PROVINCES = [
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara"
] as const;

const slugify = (province: string) => province.toLowerCase().replace(/ /g, "-");

const provincial: DemoAccount[] = KALIMANTAN_PROVINCES.flatMap((province) => {
  const slug = slugify(province);
  return [
    { email: `operator.dlh.${slug}@demo.lumi.id`, role: "DLH" as const, destination: "/ops/peta-nasional", label: `Operator DLH ${province}`, province },
    { email: `koordinator.bpbd.${slug}@demo.lumi.id`, role: "BPBD" as const, destination: "/ops/nasional", label: `Koordinator BPBD ${province}`, province }
  ];
});

/**
 * Provincial accounts for the two field agencies across all five Kalimantan
 * provinces. The national roles stay single accounts; a province-scoped officer
 * gets their province as an explicit field so the UI can render it as a clean
 * two-line identity instead of a long run-on label.
 */
export const localDemoAccounts: Record<string, DemoAccount> = Object.fromEntries([
  { email: "simulator@demo.lumi.id", role: "SIMULATOR" as const, destination: "/ops/simulasi", label: "Operator Simulator" },
  { email: "operator.klhk@demo.lumi.id", role: "KLHK" as const, destination: "/ops/monitoring", label: "Verifikator KLH" },
  { email: "koordinator.bnpb@demo.lumi.id", role: "BNPB" as const, destination: "/ops/nasional", label: "Koordinator BNPB" },
  { email: "amelia.warga@demo.lumi.id", role: "WARGA" as const, destination: "/wilayah/pontianak", label: "Amelia — Warga" },
  ...provincial
].map((account) => [account.email, account]));

/** Legacy single-province aliases keep old sessions and bookmarks working; each now names its province. */
localDemoAccounts["operator.dlh@demo.lumi.id"] = { email: "operator.dlh@demo.lumi.id", role: "DLH", destination: "/ops/peta-nasional", label: "Operator DLH Kalimantan Barat", province: "Kalimantan Barat" };
localDemoAccounts["koordinator.bpbd@demo.lumi.id"] = { email: "koordinator.bpbd@demo.lumi.id", role: "BPBD", destination: "/ops/nasional", label: "Koordinator BPBD Kalimantan Barat", province: "Kalimantan Barat" };

export type LocalDemoAccount = DemoAccount;

export function getLocalDemoAccount(role: DemoRole, province?: string): LocalDemoAccount {
  if (province) {
    const scoped = Object.values(localDemoAccounts).find((account) => account.role === role && account.province === province);
    if (scoped) return scoped;
  }
  return Object.values(localDemoAccounts).find((account) => account.role === role) ?? localDemoAccounts["simulator@demo.lumi.id"];
}

export function localDemoAccountByEmail(email: string): LocalDemoAccount | null {
  return localDemoAccounts[email.trim().toLowerCase()] ?? null;
}

/** Every password-protected ops account shares the demo password. */
export function opsAccountsForLogin(): DemoAccount[] {
  return Object.values(localDemoAccounts).filter((account) => account.role !== "WARGA");
}
