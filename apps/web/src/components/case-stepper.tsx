"use client";

import type { CaseStep } from "@/lib/demo-cases";

function StepGlyph({ state, index }: { state: CaseStep["state"]; index: number }) {
  if (state === "done") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>;
  if (state === "locked") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3" /><rect x="5" y="11" width="14" height="9" rx="2" /></svg>;
  if (state === "failed") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;
  return <span>{index + 1}</span>;
}

/**
 * Horizontal, forward-only progress. The active step owns the only action
 * surface, so a case can advance but never step back or be cancelled.
 */
export function CaseStepper({ steps, children }: Readonly<{ steps: CaseStep[]; children?: React.ReactNode }>) {
  const activeIndex = steps.findIndex((step) => step.state === "active");
  return <ol className="case-stepper" aria-label="Tahapan kasus">
    {steps.map((step, index) => <li key={step.label} className={`case-step is-${step.state}`} aria-current={step.state === "active" ? "step" : undefined}>
      <div className="case-step-head"><span className="case-step-glyph"><StepGlyph state={step.state} index={index} /></span><div><strong>{step.label}</strong><small>{step.hint}</small></div></div>
      {index === activeIndex && children ? <div className="case-step-actions">{children}</div> : null}
    </li>)}
  </ol>;
}
