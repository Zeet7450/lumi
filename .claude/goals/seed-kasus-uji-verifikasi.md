# Goal: Seed Kasus Uji untuk Testing Manual Alur Verifikasi

> Simpan sebagai `.claude/goals/seed-kasus-uji-verifikasi.md`. Scope kecil, developer TIDAK menjalankan alurnya — cuma bikin data awal, user yang akan klik/proses manual di UI Ops untuk testing.

## Tujuan
Developer membuat 3-5 kasus dummy di database dengan status awal "Kasus terdeteksi" saja (belum diapa-apakan), supaya user bisa manual testing seluruh alur verifikasi (DLH Provinsi → BPBD Provinsi → BNPB/KLHK) langsung dari UI Ops.

## Kriteria Selesai (Definition of Done)

- [ ] 3-5 kasus baru muncul di dashboard DLH Provinsi & BPBD Provinsi dengan status awal **"Kasus terdeteksi"** — TIDAK diproses lebih lanjut oleh developer
- [ ] Tiap kasus punya data realistis: lokasi (kabupaten/kota), provinsi, deskripsi singkat, tingkat AQI/severity awal, waktu deteksi
- [ ] Provinsi bervariasi (bukan cuma 1 provinsi yang sama) — sekalian jadi data buat tes filter provinsi di peta

**Variasi skenario per kasus** (naratif aja buat ngarahin user pas testing manual, JANGAN di-hardcode status akhirnya — user yang klik sendiri jalurnya):
- Kasus 1: skala kecil, gejala ringan → natural buat dites jalur "Selesai" langsung di BPBD (tanpa eskalasi)
- Kasus 2: sinyal lemah/meragukan, kemungkinan bukan kebakaran berman → natural buat dites DLH klik "Tolak"
- Kasus 3: skala besar/parah, AQI tinggi → natural buat dites jalur eskalasi penuh sampai BNPB & KLHK
- Kasus 4: skala menengah → natural buat dites DLH flag "butuh bantuan" langsung ke KLHK
- Kasus 5 (opsional, kalau sempat): provinsi lain lagi, buat tambahan variasi data peta

- [ ] Setelah selesai, developer kasih daftar 3-5 kasus yang dibuat (nama lokasi + provinsi) ke user, supaya gampang dicari di UI pas mulai testing

## Dikerjakan oleh
`developer` — langsung, tidak perlu lewat qa-visual/qa-functional dulu karena ini cuma seed data buat testing manual user sendiri

## Status
done — 5 kasus di-seed via `scripts/seed-demo-cases.mjs` (event CREATE_CASE legal, tervalidasi `isDemoCaseState`), terverifikasi tampil di dashboard DLH & BPBD, semua status "Menunggu verifikasi DLH"
