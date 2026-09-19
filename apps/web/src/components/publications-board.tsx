"use client";

import { useState } from "react";

export function PublicationsBoard() {
  const [decision, setDecision] = useState<"" | "approved" | "rejected">("");
  return <><div className="ops-header"><div><p className="eyebrow">Diskominfo</p><h1>Antrean publikasi</h1><p className="muted">Setujui atau kembalikan draf setelah bukti dan bahasa warga diperiksa.</p></div></div><section className="ops-panel"><span className="badge tier-verify">● Menunggu approval</span><h2>Pesan warga untuk Pontianak</h2><p>“Kualitas udara sedang memburuk. Kurangi aktivitas di luar ruangan, gunakan masker bila perlu keluar, dan utamakan perlindungan anak-anak serta lansia.”</p><div className="callout"><strong>Sebelum menerbitkan:</strong> pastikan draf ini sesuai bukti yang sudah divalidasi. Tindakan ini tidak dapat dibatalkan dari layar warga.</div><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}><button className="button" onClick={() => setDecision("approved")}>Setujui untuk portal warga</button><button className="button secondary" onClick={() => setDecision("rejected")}>Kembalikan ke DLH</button></div>{decision && <p role="status" className="preview">Pratinjau UI: draf akan {decision === "approved" ? "dikirim ke endpoint approval" : "dikembalikan dengan catatan"} saat backend aktif. Tidak ada publikasi optimistis di browser.</p>}</section></>;
}
