/**
 * Region switching + naming for the citizen profile. The citizen account is
 * device-local (localStorage), so changing "wilayah utama" means writing the
 * stored account row. Kept next to warga-session so the storage rules stay in
 * one place.
 */
import { readAccount, registerAccount, DEMO_ACCOUNT, type WargaAccount } from "./warga-session";
import { demoReferencePoints } from "./demo-locations";

/**
 * Persist a new primary region for the logged-in account. The built-in demo
 * citizen (Amelia) has no writable account row on the device, so her profile is
 * written into the account store with the chosen region; readSession resolves
 * the stored account first, so the change takes effect immediately.
 */
export function saveAccountRegion(account: WargaAccount, region: string): WargaAccount {
  const next = { ...account, region };
  registerAccount(next);
  return next;
}

/** Slug form of a kabupaten name, e.g. "Kota Pontianak" -> "kota-pontianak". */
export function kabupatenSlug(kabupaten: string): string {
  return kabupaten.toLowerCase().replace(/\s+/g, "-");
}

/** Kabupaten options for region pickers: one entry per kabupaten, in order. */
export function kabupatenOptions(): Array<{ slug: string; label: string }> {
  const seen = new Map<string, string>();
  for (const point of demoReferencePoints) if (!seen.has(point.kabupaten)) seen.set(point.kabupaten, kabupatenSlug(point.kabupaten));
  return [...seen.entries()].map(([label, slug]) => ({ slug, label }));
}

/**
 * Human name for whatever the account stores: a station id ("pontianak-utara")
 * or a kabupaten/area slug ("pontianak", "kota-pontianak") both resolve to the
 * kabupaten name, which is what Beranda and the topbar show.
 */
export function regionDisplayLabel(slug: string | undefined): string {
  if (!slug) return "belum dipilih";
  const station = demoReferencePoints.find((point) => point.id === slug);
  if (station) return station.kabupaten;
  const needle = slug.replace(/-/g, " ");
  const area = demoReferencePoints.find((point) => point.kabupaten.toLowerCase().includes(needle));
  return area?.kabupaten ?? slug;
}

/** Convenience read used by pages that only need the current account row. */
export function currentAccount(): WargaAccount | null {
  return readAccount() ?? (typeof window === "undefined" ? null : DEMO_ACCOUNT);
}
