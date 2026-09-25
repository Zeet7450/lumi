"use client";

import { agencyReadouts, type DemoCase } from "@/lib/demo-cases";

/**
 * Cross-agency status is always derived from the case event log. There is no
 * control anywhere in the UI that writes these values by hand — KLHK acting in
 * the field changes what every other agency sees, automatically.
 */
export function CaseReadouts({ value, compact = false }: Readonly<{ value: DemoCase; compact?: boolean }>) {
  return <div className={compact ? "case-readouts is-compact" : "case-readouts"} aria-label="Status antar instansi (read-only)">{agencyReadouts(value).map((item) => <span key={item.agency} className={`case-readout is-${item.tone}`}><strong>{item.agency}</strong><small>{item.label}</small></span>)}</div>;
}
