"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { applyDemoCommand, DEMO_ROLES, deserializeDemoScenario, initialDemoScenario, serializeDemoScenario, type DemoCommand, type DemoCommandInput, type DemoRole, type DemoScenario, type PublicDemoNotice, projectPublicDemoNotice } from "@/lib/demo-scenario";

const storageKey = "lumi-product-demo-scenario-v1";
const roleStorageKey = "lumi-product-demo-role-v1";
const channelName = "lumi-product-demo-scenario";
const bridgeUrl = "http://127.0.0.1:3100/state";

type DemoScenarioContextValue = {
  scenario: DemoScenario;
  role: DemoRole;
  setRole: (role: DemoRole) => void;
  run: (command: DemoCommandInput) => void;
  publicNotice: PublicDemoNotice | null;
  isReady: boolean;
};

const DemoScenarioContext = createContext<DemoScenarioContextValue | null>(null);

export function DemoScenarioProvider({ children, sessionRole }: Readonly<{ children: React.ReactNode; sessionRole?: DemoRole }>) {
  const [scenario, setScenario] = useState(initialDemoScenario);
  const [role, setRole] = useState<DemoRole>(sessionRole ?? "SIMULATOR");
  const [isReady, setReady] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const scenarioRef = useRef(scenario);
  useEffect(() => { scenarioRef.current = scenario; }, [scenario]);
  useEffect(() => {
    let saved: DemoScenario | null = null;
    let raw: string | null = null;
    try { raw = window.localStorage.getItem(storageKey); saved = deserializeDemoScenario(raw); }
    catch { /* Local storage can be unavailable in a privacy-restricted browser. */ }
    if (saved) setScenario(saved);
    else if (raw) {
      try { window.localStorage.removeItem(storageKey); }
      catch { /* The in-memory deterministic state remains usable. */ }
    }
    try {
      const savedRole = window.localStorage.getItem(roleStorageKey);
      if (!sessionRole && savedRole && DEMO_ROLES.includes(savedRole as DemoRole)) setRole(savedRole as DemoRole);
    } catch { /* The default Simulator role remains usable without local storage. */ }
    setReady(true);
    try {
      if ("BroadcastChannel" in window) {
        channel.current = new BroadcastChannel(channelName);
        channel.current.onmessage = (event: MessageEvent<string>) => {
          const next = typeof event.data === "string" ? deserializeDemoScenario(event.data) : null;
          if (next) setScenario(next);
        };
      }
    } catch { channel.current = null; }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const next = deserializeDemoScenario(event.newValue);
      if (next) setScenario(next);
      else if (event.newValue) {
        try { window.localStorage.removeItem(storageKey); }
        catch { /* Reject the invalid storage write without changing live state. */ }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => { channel.current?.close(); channel.current = null; window.removeEventListener("storage", onStorage); };
  }, [sessionRole]);
  useEffect(() => {
    let disposed = false;
    const pull = async () => {
      try {
        const response = await fetch(bridgeUrl, { cache: "no-store" });
        const data: unknown = await response.json();
        if (typeof data === "object" && data !== null && "scenario" in data) {
          const next = deserializeDemoScenario(JSON.stringify((data as { scenario?: unknown }).scenario));
          if (next && !disposed) { scenarioRef.current = next; setScenario(next); }
        }
      } catch { /* The standalone local demo remains usable while the bridge is starting. */ }
    };
    void pull();
    const timer = window.setInterval(() => void pull(), 3_000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, []);
  const commit = useCallback((next: DemoScenario) => {
    const serialized = serializeDemoScenario(next);
    scenarioRef.current = next;
    setScenario(next);
    try { window.localStorage.setItem(storageKey, serialized); }
    catch { /* Keep the live demo usable when persistent browser storage is unavailable. */ }
    channel.current?.postMessage(serialized);
    void fetch(bridgeUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ synthetic: true, scenario: JSON.parse(serialized), notices: projectPublicDemoNotice(next) ? [projectPublicDemoNotice(next)] : [] }) }).catch(() => undefined);
  }, []);
  const run = useCallback((command: DemoCommandInput) => {
    const next = applyDemoCommand(scenarioRef.current, { ...command, actor: role } as DemoCommand);
    commit(next);
  }, [commit, role]);
  const chooseRole = useCallback((nextRole: DemoRole) => {
    if (sessionRole && nextRole !== sessionRole) return;
    if (!DEMO_ROLES.includes(nextRole)) return;
    setRole(nextRole);
    try { window.localStorage.setItem(roleStorageKey, nextRole); }
    catch { /* Keep the in-memory role usable when persistent browser storage is unavailable. */ }
  }, [sessionRole]);
  const value = useMemo(() => ({ scenario, role, setRole: chooseRole, run, publicNotice: projectPublicDemoNotice(scenario), isReady }), [scenario, role, chooseRole, run, isReady]);
  return <DemoScenarioContext.Provider value={value}>{children}</DemoScenarioContext.Provider>;
}

export function useDemoScenario(): DemoScenarioContextValue {
  const context = useContext(DemoScenarioContext);
  if (!context) throw new Error("useDemoScenario must be used inside DemoScenarioProvider.");
  return context;
}
