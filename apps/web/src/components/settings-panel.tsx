"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { getLocalDemoAccount } from "@/lib/local-demo-identity";
import { useDemoScenario } from "./demo-scenario-store";
import { LocalDemoLogout } from "./local-demo-logout";

type Settings = { name: string; avatar?: string; font: "normal" | "large"; density: "comfortable" | "compact"; theme: "system" | "light" | "dark" };
const key = "lumi-user-settings";
const defaults: Settings = { name: "Pengguna LUMI", font: "normal", density: "comfortable", theme: "system" };

export function SettingsPanel({ audience }: { audience: "petugas" | "warga" }) {
  const { role } = useDemoScenario();
  const account = getLocalDemoAccount(role);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem(`${key}-${audience}`);
    const preference = window.localStorage.getItem("lumi-theme-preference");
    const theme = preference === "system" || preference === "light" || preference === "dark" ? preference : "system";
    try {
      const saved = stored ? JSON.parse(stored) as Partial<Settings> : {};
      setSettings({ ...defaults, ...saved, theme });
    } catch {
      setSettings({ ...defaults, theme });
    }
    setHydrated(true);
  }, [audience]);
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.fontScale = settings.font;
    const appliesDark = settings.theme === "dark" || (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = appliesDark ? "dark" : "light";
    window.localStorage.setItem("lumi-theme-preference", settings.theme);
    window.localStorage.setItem(`${key}-${audience}`, JSON.stringify(settings));
  }, [audience, hydrated, settings]);
  const update = <K extends keyof Settings>(field: K, value: Settings[K]) => setSettings((current) => ({ ...current, [field]: value }));
  function chooseAvatar(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file || file.size > 500_000) return; const reader = new FileReader(); reader.onload = () => update("avatar", String(reader.result)); reader.readAsDataURL(file); }
  const initials = settings.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "LU";
  return <section className="settings-panel"><header className="command-header"><div><p className="eyebrow">Pengaturan {audience}</p><h1>Tampilan & profil</h1><p className="muted">Disimpan di perangkat ini tanpa mengirim foto atau preferensi ke server.</p></div></header><div className="settings-grid"><section className="command-panel"><p className="eyebrow">Akun demo</p><div className="avatar-row"><span className="avatar">{settings.avatar ? <img src={settings.avatar} alt="Avatar pengguna" /> : initials}</span><label className="button secondary">Pilih avatar<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseAvatar} /></label></div><label className="field">Peran aktif<input value={account.label} readOnly /></label><label className="field">Email akun demo<input value={account.email} readOnly /></label><label className="field">Nama tampilan<input value={settings.name} maxLength={60} onChange={(event) => update("name", event.target.value)} /></label><p className="muted small">PNG, JPG, atau WebP sampai 500 KB.</p><div className="settings-logout"><p className="muted small">Keluar akan mengakhiri sesi demo lokal pada browser ini.</p><LocalDemoLogout confirm /></div></section><section className="command-panel"><p className="eyebrow">Tampilan & aksesibilitas</p><label className="field">Tema<select value={settings.theme} onChange={(event) => update("theme", event.target.value as Settings["theme"])}><option value="system">Ikuti perangkat</option><option value="light">Terang</option><option value="dark">Gelap</option></select></label><label className="field">Ukuran teks<select value={settings.font} onChange={(event) => update("font", event.target.value as Settings["font"])}><option value="normal">Normal</option><option value="large">Besar</option></select></label><label className="field">Kepadatan dashboard<select value={settings.density} onChange={(event) => update("density", event.target.value as Settings["density"])}><option value="comfortable">Nyaman dibaca</option><option value="compact">Ringkas</option></select></label></section></div></section>;
}
