"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { applyCaseCommand, caseSourceFromScenario, deserializeDemoCaseState, initialDemoCaseState, notificationsForRole, pendingResponders, serializeDemoCaseState, unseenNotifications, type CaseCommandInput, type CaseNotification, type DemoCase, type DemoCaseState } from "@/lib/demo-cases";
import type { DemoScenario } from "@/lib/demo-scenario";
import { useDemoScenario } from "./demo-scenario-store";

const storageKey = "lumi-demo-cases-v1";
const channelName = "lumi-demo-cases";
const bridgeUrl = "http://127.0.0.1:3100/state";

type DemoCasesContextValue = {
  cases: DemoCase[];
  state: DemoCaseState;
  run: (command: CaseCommandInput) => void;
  createCaseFromScenario: (scenario: DemoScenario) => void;
  notifications: Array<CaseNotification & { seen: boolean }>;
  unseen: CaseNotification[];
  markSeen: (ids: string[]) => void;
  pending: ReturnType<typeof pendingResponders>;
  isReady: boolean;
};

const DemoCasesContext = createContext<DemoCasesContextValue | null>(null);

export function DemoCasesProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { scenario, role } = useDemoScenario();
  const [state, setState] = useState<DemoCaseState>(initialDemoCaseState);
  const [isReady, setReady] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef(state);
  const scenarioRef = useRef(scenario);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { scenarioRef.current = scenario; }, [scenario]);

  useEffect(() => {
    let saved: DemoCaseState | null = null;
    let raw: string | null = null;
    try { raw = window.localStorage.getItem(storageKey); saved = deserializeDemoCaseState(raw); }
    catch { /* Local storage can be unavailable in a privacy-restricted browser. */ }
    if (saved) setState(saved);
    else if (raw) {
      try { window.localStorage.removeItem(storageKey); }
      catch { /* The in-memory deterministic state remains usable. */ }
    }
    setReady(true);
    try {
      if ("BroadcastChannel" in window) {
        channel.current = new BroadcastChannel(channelName);
        channel.current.onmessage = (event: MessageEvent<string>) => {
          const next = typeof event.data === "string" ? deserializeDemoCaseState(event.data) : null;
          if (next) setState(next);
        };
      }
    } catch { channel.current = null; }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const next = deserializeDemoCaseState(event.newValue);
      if (next) setState(next);
      else if (event.newValue) {
        try { window.localStorage.removeItem(storageKey); }
        catch { /* Reject the invalid storage write without changing live state. */ }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => { channel.current?.close(); channel.current = null; window.removeEventListener("storage", onStorage); };
  }, []);

  useEffect(() => {
    let disposed = false;
    const pull = async () => {
      try {
        const response = await fetch(bridgeUrl, { cache: "no-store" });
        const data: unknown = await response.json();
        if (typeof data === "object" && data !== null && "caseState" in data) {
          const next = deserializeDemoCaseState(JSON.stringify((data as { caseState?: unknown }).caseState));
          if (next && !disposed) { stateRef.current = next; setState(next); }
        }
      } catch { /* The standalone local demo remains usable while the bridge is starting. */ }
    };
    void pull();
    const timer = window.setInterval(() => void pull(), 3_000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, []);

  const commit = useCallback((next: DemoCaseState) => {
    const serialized = serializeDemoCaseState(next);
    stateRef.current = next;
    setState(next);
    try { window.localStorage.setItem(storageKey, serialized); }
    catch { /* Keep the live demo usable when persistent browser storage is unavailable. */ }
    channel.current?.postMessage(serialized);
    void fetch(bridgeUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ synthetic: true, caseState: JSON.parse(serialized) }) }).catch(() => undefined);
  }, []);

  const run = useCallback((command: CaseCommandInput) => {
    const next = applyCaseCommand(stateRef.current, { ...command, actor: role } as Parameters<typeof applyCaseCommand>[1]);
    commit(next);
  }, [commit, role]);

  const createCaseFromScenario = useCallback((next: DemoScenario) => {
    const source = caseSourceFromScenario(next);
    const applied = applyCaseCommand(stateRef.current, { type: "CREATE_CASE", actor: "SIMULATOR", source }, new Date().toISOString());
    commit(applied);
  }, [commit]);

  const markSeen = useCallback((ids: string[]) => {
    if (!ids.length) return;
    commit(applyCaseCommand(stateRef.current, { type: "MARK_NOTIFICATIONS_SEEN", actor: role, ids }));
  }, [commit, role]);

  const value = useMemo<DemoCasesContextValue>(() => ({
    cases: state.cases,
    state,
    run,
    createCaseFromScenario,
    notifications: notificationsForRole(state, role),
    unseen: unseenNotifications(state, role),
    markSeen,
    pending: pendingResponders(state),
    isReady
  }), [state, role, run, createCaseFromScenario, markSeen, isReady]);
  return <DemoCasesContext.Provider value={value}>{children}</DemoCasesContext.Provider>;
}

export function useDemoCases(): DemoCasesContextValue {
  const context = useContext(DemoCasesContext);
  if (!context) throw new Error("useDemoCases must be used inside DemoCasesProvider.");
  return context;
}
