"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardPath, readSession } from "@/lib/warga-session";

/**
 * Client-side guard for the citizen dashboard. The citizen session lives in
 * localStorage, so the server cannot see it; this guard fails closed (renders
 * nothing) until the session is known, then redirects logged-out visitors to
 * the landing page.
 */
export function CitizenRouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"unknown" | "allowed">("unknown");

  useEffect(() => {
    if (readSession()) return setState("allowed");
    router.replace("/");
  }, [router]);

  if (state === "unknown") return null;
  return <>{children}</>;
}
