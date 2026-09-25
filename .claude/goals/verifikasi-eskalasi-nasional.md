# Goal: Verifikasi & Eskalasi Provinsi ke Nasional (DLH Prov, BPBD Prov, BNPB, KLHK)

> Simpan sebagai `.claude/goals/verifikasi-eskalasi-nasional.md`. Scope ini FUNGSIONAL LENGKAP — security/permission ditunda, yang penting alurnya beneran jalan end-to-end dan kode rapi (bukan slop).
> Fokus: DLH Provinsi & BPBD Provinsi ke atas (BNPB, KLHK). DLH/BPBD Kabupaten TIDAK termasuk scope ini.

## Tujuan
Sistem verifikasi & eskalasi kasus (misal kebakaran lahan) dari DLH Provinsi & BPBD Provinsi ke BNPB & KLHK di level nasional, dengan status yang cuma bisa maju (tidak bisa mundur/dibatalkan), notifikasi real-time, dan log audit permanen.

## Alur Kasus (Case Lifecycle)

1. **Kasus terdeteksi**
2. **DLH Provinsi verifikasi** — pilihan: **Approve/Terverifikasi** atau **Tolak** (kasus bukan tugas DLH / tidak sesuai)
   - Kalau Approve: status diperbarui lewat **stepper** (lihat komponen UI di bawah)
3. **BPBD Provinsi verifikasi** — setelah dapat info terverifikasi dari DLH, BPBD klik **Setuju turun ke lapangan**, update status via stepper juga
4. **BPBD branch** — dua pilihan:
   - **Selesai** (kasus ditutup)
   - **Butuh bantuan** (kapasitas BPBD Provinsi tidak cukup) → tombol eskalasi ke BNPB
5. **Setiap kasus yang diverifikasi DLH otomatis masuk ke KLHK** (monitoring), terlepas dari eskalasi ke BNPB atau tidak
   - DLH bisa **flag/ubah kasus supaya KLHK tahu DLH butuh bantuan** (trigger terpisah dari eskalasi BPBD→BNPB)
6. **KLHK verifikasi** — cuma 2 pilihan: **Approve** atau **Menunggu** (berarti diverifikasi ulang, tidak maju dulu)
7. **Kalau KLHK Approve**:
   - **Wewenang menutup kasus pindah ke KLHK** — DLH TIDAK BISA lagi klik "selesai" di dashboard-nya untuk kasus ini (mencegah data tidak sinkron, KLHK yang jadi otoritas final)
8. **BNPB** (setelah dapat eskalasi dari BPBD) **TIDAK langsung bertindak** — menunggu verifikasi final dari KLHK dulu
   - Setelah KLHK approve, BNPB baru bisa mulai bertindak/turun ke lapangan

## Komponen UI: Stepper

- Update status (oleh DLH maupun BPBD) pakai **stepper** (progress step indicator horizontal) — BUKAN dropdown biasa
- Sifat: **linear, forward-only** — sekali diklik lanjut ke step berikutnya, TIDAK BISA mundur atau dibatalkan
- Developer: cari komponen stepper/step-indicator yang sudah ada di library UI yang dipakai (jangan bikin dari nol kalau ada yang siap pakai)

## Dashboard BNPB — Status Antar Instansi

- Saat kasus diklik, tampil status tiap instansi: **"DLH terjun/bergerak"**, **"BPBD terjun"**, **"KLHK memantau"**
- Status ini **READ-ONLY** — merefleksikan status asli tiap instansi, BNPB TIDAK BISA edit manual
- **Sinkronisasi**: kalau KLHK mengubah statusnya sendiri jadi "terjun", BNPB otomatis ikut berubah jadi "terjun" — dan perubahan ini juga kelihatan di tampilan KLHK

## Notifikasi & Log

- **Notifikasi**: setiap perubahan status kasus (approve, tolak, eskalasi, dll) memicu notifikasi di pojok kanan atas app (ada ikon/tombol notif sendiri, bisa diklik untuk detail)
- Setelah notifikasi "terpakai"/dilihat, riwayatnya masuk ke **log**
- **Log bersifat PERMANEN, tidak bisa dihapus** — audit trail lengkap semua aksi tiap akun
- Log HARUS bisa menunjukkan kalau ada akun yang TIDAK merespon/approve (akuntabilitas)
- Ada tombol/halaman terpisah untuk mengakses & melihat log ini

## Peta — Standar ISPU Indonesia

- Pakai standar warna resmi ISPU (BUKAN standar IQAir/internasional yang dipakai sebelumnya di landing warga):
  - Hijau: 0-50 (Baik)
  - Biru: 51-100 (Sedang)
  - Kuning: 101-200 (Tidak Sehat)
  - Merah: 201-300 (Sangat Tidak Sehat)
  - Hitam: >300 (Berbahaya)
- Angka AQI **tertulis langsung di titik/marker** — user tidak perlu klik untuk tahu angkanya (ikuti referensi ISPU KLHK: ispu.kemenlh.go.id)
- **1000-10000 titik di seluruh Indonesia** — data DUMMY/SIMULASI, di-generate oleh developer/AI agent (bukan sensor real, jaringan sensor sebanyak itu belum ada)
- Clustering WAJIB aktif mengingat volume titik yang sangat besar (lihat juga requirement clustering di goal file landing page warga)
- **Filter sortir provinsi**: DLH bisa pilih salah satu dari 38 provinsi — saat dipilih, peta menampilkan garis batas wilayah provinsi tsb dengan jelas (butuh data GeoJSON batas provinsi Indonesia — data ini publicly available, developer perlu cari sumbernya)
- **Sortir tambahan**: A-Z (nama lokasi), AQI terendah, AQI tertinggi

## Dikerjakan oleh
`developer` (implementasi alur, stepper, notif, log, peta) → `qa-functional` (test alur eskalasi end-to-end, sinkronisasi status, akurasi log) → `qa-visual` (stepper terlihat jelas forward-only, notif & warna ISPU sesuai standar)

## Dependency
Tidak ada yang memblokir. Referensi silang: requirement clustering di `.claude/goals/landing-page-warga.md` — sudah `done`.

## Verifikasi sebelum status "done"
- [ ] Rekaman video alur LENGKAP: kasus terdeteksi → DLH approve → BPBD approve → eskalasi BNPB → BNPB menunggu → KLHK approve → BNPB mulai bertindak → closing authority pindah ke KLHK
- [ ] Rekaman video kasus yang DITOLAK DLH (jalur pendek)
- [ ] Rekaman video KLHK pilih "Menunggu" (kasus tidak maju, tetap di status semula)
- [ ] Screenshot notifikasi muncul + log mencatat perubahan
- [ ] Screenshot peta dengan filter provinsi aktif (garis batas kelihatan) dan sortir AQI

## Di luar scope ini (sengaja ditunda)
- [ ] DLH/BPBD Kabupaten — tidak termasuk demo ini
- [ ] Keamanan/permission granular — fungsi jalan lebih penting dari security untuk demo ini
- [ ] Notifikasi push ke device eksternal (cukup notifikasi in-app)

## Catatan
- Ini FITUR BESAR — kalau waktu 3 hari mepet, prioritaskan alur inti (poin 1-8) dulu sebelum notifikasi/log/peta 1000-10000 titik. Diskusikan ke PM urutan prioritas kalau semua goal file (landing warga, ops login, ini) tidak akan kelar bareng dalam waktu tersisa.

## Status
ready-for-qa — implementasi selesai & diverifikasi browser sekali jalan penuh (Simulator → DLH setuju/tolak → BPBD setuju → eskalasi BNPB → KLHK menunggu → KLHK approve → KLHK terjun → BNPB bertindak → KLHK tutup). `pnpm typecheck` + 25 unit test hijau. Rekaman video & screenshot akhir untuk kriteria "done" diserahkan ke `qa-functional` / `qa-visual`.

Catatan implementasi untuk QA:
- Halaman baru: `/ops/kasus` (DLH & BPBD Provinsi), `/ops/nasional` (BNPB), `/ops/monitoring` (KLHK), `/ops/log` (semua peran ops), `/ops/peta-nasional` (DLH/BPBD/BNPB/KLHK).
- Akun demo baru: `eskalasi.bnpb@demo.lumi.id` (BNPB) dan `monitoring.klhk@demo.lumi.id` (KLHK), kata sandi sama dengan akun demo lain.
- Kasus dibuat otomatis saat Simulator menekan "Play semua" dari status READY (satu kasus per skenario).
- Skala peta lama (ops & operasional) ikut dipindah ke ISPU 5 band; dua bug lama diperbaiki: import tanpa ekstensi di `demo-scenario.ts` (membuat `pnpm test` merah) dan `.ops-main` kolaps 0px pada viewport ≤760px.
- Video belum direkam — itu bagian QA.
