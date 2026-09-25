"use client";

import { logoutLocalDemo } from "@/app/local-demo-actions";
import { LogoutModal } from "./logout-modal";

/**
 * Ops-side logout. The form action still runs the server logout; the themed
 * modal (not window.confirm) asks for confirmation first, matching the app's
 * design tokens.
 */
export function LocalDemoLogout({ confirm = false }: { confirm?: boolean }) {
  return <LogoutModal
    variant="ops"
    triggerClassName="text-utility"
    message="Keluar akan mengakhiri sesi pada browser ini. Masuk kembali dengan kredensial instansi Anda untuk melanjutkan."
    logout={() => { void logoutLocalDemo(); }}
  />;
}
