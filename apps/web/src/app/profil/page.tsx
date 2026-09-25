"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, ChangeEvent, useState } from "react";
import { CitizenShell } from "@/components/citizen-shell";
import { LogoutModal } from "@/components/logout-modal";
import { dashboardPath, readSession, type WargaAccount } from "@/lib/warga-session";
import { kabupatenOptions, regionDisplayLabel, saveAccountRegion } from "@/lib/warga-region";

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "W";

/** Citizen profile: identity, avatar, primary region, and session controls. */
export default function CitizenProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<WargaAccount | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [savedRegion, setSavedRegion] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSession(readSession());
    try { setAvatar(window.localStorage.getItem("lumi-warga-avatar")); } catch { /* Avatar stays initial-based without storage. */ }
    setHydrated(true);
  }, []);

  const initials = useMemo(() => initialsOf(session?.nickname || "Warga"), [session]);
  const regions = useMemo(() => kabupatenOptions(), []);

  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.size > 500_000) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result);
      setAvatar(data);
      try { window.localStorage.setItem("lumi-warga-avatar", data); } catch { /* In-memory only when storage is unavailable. */ }
    };
    reader.readAsDataURL(file);
  };

  const changeRegion = (slug: string) => {
    if (!session || slug === session.region) { setSavedRegion(null); return; }
    const next = saveAccountRegion(session, slug);
    setSession(next);
    setSavedRegion(next.region);
  };

  const logout = () => { router.push("/"); window.location.reload(); };

  return <CitizenShell>
    <section className="citizen-page citizen-profile">
      <header className="citizen-page-head"><p className="warga-eyebrow">PROFIL</p><h1>Akun dan sesi Anda.</h1></header>
      <div className="profile-card">
        <div className="profile-identity">
          <span className="avatar avatar-citizen">{avatar ? <img src={avatar} alt="Foto profil" /> : initials}</span>
          <div>
            <strong>{session?.nickname || "Warga"}</strong>
            <span className="muted">{session?.email}</span>
            <span className="muted small">Wilayah utama: {regionDisplayLabel(session?.region)}</span>
          </div>
        </div>
        <div className="profile-actions">
          <label className="button secondary">Ganti foto<input hidden type="file" accept="image/png,image/jpeg,image/webp" ref={fileRef} onChange={chooseAvatar} /></label>
          <Link className="button secondary" href="/pengaturan">Pengaturan tampilan</Link>
          <LogoutModal variant="warga" triggerClassName="citizen-logout profile-logout" logout={logout} disabled={!hydrated} />
        </div>
      </div>

      <div className="profile-card profile-region">
        <div className="profile-region-head">
          <h2>Wilayah utama</h2>
          <p className="muted">Beranda, pemberitahuan, dan laporan Anda mengikuti wilayah ini.</p>
        </div>
        <label className="profile-region-field">
          <span>Pilih kabupaten/kota</span>
          <select value={session?.region ?? ""} onChange={(event) => changeRegion(event.target.value)} disabled={!hydrated || !session}>
            {regions.map((region) => <option key={region.slug} value={region.slug}>{region.label}</option>)}
          </select>
        </label>
        {savedRegion ? <p className="warga-message" role="status">Wilayah utama diganti ke {regionDisplayLabel(savedRegion)}. <Link href={dashboardPath(savedRegion)}>Buka Beranda baru</Link>.</p> : null}
      </div>
    </section>
  </CitizenShell>;
}
