import { PublicGuidance } from "@/components/public-guidance";
import { PublicShell } from "@/components/public-shell";

export default function GuidancePage() { return <PublicShell><p className="eyebrow">Panduan LUMI</p><h1 style={{ fontSize: "2.25rem", marginTop: 6 }}>Cara membaca pembaruan kualitas udara</h1><p className="muted">Periksa waktu pembaruan dan sumbernya sebelum mengambil tindakan. Data yang perlu diperbarui tidak berarti kondisi sudah membaik.</p><PublicGuidance /><section className="section callout"><strong>Kelompok rentan.</strong> Jika muncul sesak napas, nyeri dada, atau keluhan yang memburuk, hubungi fasilitas kesehatan setempat.</section></PublicShell>; }
