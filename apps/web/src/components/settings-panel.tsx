"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { getLocalDemoAccount } from "@/lib/local-demo-identity";
import { readThemePreference, setThemePreference, type ThemePreference } from "@/lib/theme";
import { useDemoScenario } from "./demo-scenario-store";
import { LocalDemoLogout } from "./local-demo-logout";

type Settings = { name: string; avatar?: string; font: "normal" | "large"; theme: "system" | "light" | "dark" };
const key = "lumi-user-settings";
const defaults: Settings = { name: "Pengguna LUMI", font: "normal", theme: "system" };
/** Must match the px values in globals.css so the preview never lies. */
const FONT_PIXELS: Record<Settings["font"], number> = { normal: 16, large: 28 };

function Row({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return <div className="settings-row"><div className="settings-row-copy"><strong>{label}</strong><span className="muted small">{description}</span></div>{children}</div>;
}

export function SettingsPanel({ audience }: { audience: "petugas" | "warga" }) {
  const { role, sessionProvince } = useDemoScenario();
  const account = getLocalDemoAccount(role, sessionProvince);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem(`${key}-${audience}`);
    // The theme lives in the shared theme module (cookie + localStorage) so all
    // demo apps on this host agree. This panel reads it and never invents it.
    const theme = readThemePreference();
    try {
      // Field-by-field so removed options (e.g. the old dashboard density)
      // disappear from storage instead of riding along forever.
      const saved = stored ? (JSON.parse(stored) as Record<string, unknown>) : {};
      setSettings({
        name: typeof saved.name === "string" ? saved.name : defaults.name,
        avatar: typeof saved.avatar === "string" ? saved.avatar : undefined,
        font: saved.font === "large" ? "large" : "normal",
        theme
      });
    } catch {
      setSettings({ ...defaults, theme });
    }
    setHydrated(true);
  }, [audience]);
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.fontScale = settings.font;
    // Only profile/preference fields are stored here. The theme is persisted in
    // update() on the actual user action, so mounting this page can never
    // overwrite a theme the user already chose.
    window.localStorage.setItem(`${key}-${audience}`, JSON.stringify(settings));
  }, [audience, hydrated, settings]);
  const update = <K extends keyof Settings>(field: K, value: Settings[K]) => {
    if (field === "theme") setThemePreference(value as ThemePreference);
    setSettings((current) => ({ ...current, [field]: value }));
  };
  function chooseAvatar(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file || file.size > 500_000) return; const reader = new FileReader(); reader.onload = () => update("avatar", String(reader.result)); reader.readAsDataURL(file); }
  const initials = settings.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "LU";
  return <section className="settings-panel">
    <header className="command-header"><div><p className="eyebrow">Pengaturan {audience}</p><h1>Tampilan &amp; profil</h1><p className="muted">Disimpan di perangkat ini dan tidak dikirim ke server. Tema juga disimpan sebagai cookie agar aplikasi lain di perangkat ini ikut menyesuaikan.</p></div></header>
    <div className="settings-grid">
      <section className="command-panel">
        <p className="eyebrow">Akun</p>
        <div className="avatar-row"><span className="avatar">{settings.avatar ? <img src={settings.avatar} alt="Avatar pengguna" /> : initials}</span><label className="button secondary">Pilih avatar<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseAvatar} /></label></div>
        <label className="field">Peran aktif<input value={account.label} readOnly /></label>
        <label className="field">Email akun<input value={account.email} readOnly /></label>
        <label className="field">Nama tampilan<input value={settings.name} maxLength={60} onChange={(event) => update("name", event.target.value)} /></label>
        <p className="muted small">PNG, JPG, atau WebP sampai 500 KB.</p>
        <div className="settings-logout"><p className="muted small">Keluar akan mengakhiri sesi pada browser ini.</p><LocalDemoLogout confirm /></div>
      </section>
      <section className="command-panel">
        <p className="eyebrow">Tampilan &amp; aksesibilitas</p>
        <Row label="Tema" description="Terang, gelap, atau ikuti pengaturan perangkat.">
          <select value={settings.theme} onChange={(event) => update("theme", event.target.value as Settings["theme"])}>
            <option value="system">Ikuti perangkat</option>
            <option value="light">Terang</option>
            <option value="dark">Gelap</option>
          </select>
        </Row>
        <Row label="Ukuran teks" description="Besar memperbesar seluruh antarmuka sekitar 1,75 kali ukuran normal.">
          <select value={settings.font} onChange={(event) => update("font", event.target.value as Settings["font"])}>
            <option value="normal">Normal</option>
            <option value="large">Besar</option>
          </select>
        </Row>
        <div className="font-preview" data-scale={settings.font} role="presentation">
          <span className="font-preview-sample">Kabut tipis terpantau di Sungai Raya pagi ini.</span>
          <span className="font-preview-caption">Pratinjau langsung · {FONT_PIXELS[settings.font]} px</span>
        </div>
      </section>
    </div>
  </section>;
}
