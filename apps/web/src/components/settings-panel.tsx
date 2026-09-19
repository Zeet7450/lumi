"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Settings = { name: string; avatar?: string; font: "normal" | "large"; density: "comfortable" | "compact"; theme: "light" | "dark" };
const key = "lumi-user-settings";
const defaults: Settings = { name: "Pengguna LUMI", font: "normal", density: "comfortable", theme: "light" };

export function SettingsPanel({ audience }: { audience: "petugas" | "warga" }) {
  const [settings, setSettings] = useState<Settings>(defaults);
  useEffect(() => { const stored = window.localStorage.getItem(`${key}-${audience}`); if (stored) setSettings({ ...defaults, ...JSON.parse(stored) as Settings }); }, [audience]);
  useEffect(() => { document.documentElement.dataset.fontScale = settings.font; document.documentElement.dataset.theme = settings.theme; window.localStorage.setItem("lumi-theme", settings.theme); window.localStorage.setItem(`${key}-${audience}`, JSON.stringify(settings)); }, [audience, settings]);
  const update = <K extends keyof Settings>(field: K, value: Settings[K]) => setSettings((current) => ({ ...current, [field]: value }));
  function chooseAvatar(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file || file.size > 500_000) return; const reader = new FileReader(); reader.onload = () => update("avatar", String(reader.result)); reader.readAsDataURL(file); }
  const initials = settings.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "LU";
  return <section className="settings-panel"><header className="command-header"><div><p className="eyebrow">Pengaturan {audience}</p><h1>Tampilan & profil</h1><p className="muted">Disimpan di perangkat ini tanpa mengirim foto atau preferensi ke server.</p></div></header><div className="settings-grid"><section className="command-panel"><p className="eyebrow">Profil</p><div className="avatar-row"><span className="avatar">{settings.avatar ? <img src={settings.avatar} alt="Avatar pengguna" /> : initials}</span><label className="button secondary">Pilih avatar<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseAvatar} /></label></div><label className="field">Nama tampilan<input value={settings.name} maxLength={60} onChange={(event) => update("name", event.target.value)} /></label><p className="muted small">PNG, JPG, atau WebP sampai 500 KB.</p></section><section className="command-panel"><p className="eyebrow">Tampilan & aksesibilitas</p><label className="field">Tema<select value={settings.theme} onChange={(event) => update("theme", event.target.value as Settings["theme"])}><option value="light">Terang</option><option value="dark">Gelap</option></select></label><label className="field">Ukuran teks<select value={settings.font} onChange={(event) => update("font", event.target.value as Settings["font"])}><option value="normal">Normal</option><option value="large">Besar</option></select></label><label className="field">Kepadatan dashboard<select value={settings.density} onChange={(event) => update("density", event.target.value as Settings["density"])}><option value="comfortable">Nyaman dibaca</option><option value="compact">Ringkas</option></select></label></section></div></section>;
}
