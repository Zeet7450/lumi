import type { DemoRole } from "./demo-scenario";

/** Browser-local demo routing policy; this is not production authentication. */
export function canViewInternalDemo(role: DemoRole): boolean {
  return role !== "WARGA";
}

/**
 * The browser-local role is unknown until localStorage hydration finishes.
 * Fail closed so a persisted Warga role never receives internal route markup.
 */
export function canRenderInternalDemo(role: DemoRole, isReady: boolean): boolean {
  return isReady && canViewInternalDemo(role);
}

export function shouldShowInternalNavigation(role: DemoRole): boolean {
  return canViewInternalDemo(role);
}
