# Goal: Setup Repo — README, Env, GitHub, Vercel Deploy

> Disimpan dari permintaan PM. Semua tugas dikerjakan developer agent sendiri (bukan user manual) — termasuk push GitHub dan deploy Vercel.

## Tujuan
Developer agent menyiapkan dokumentasi project (README.md + .env.example), memastikan tidak ada secret ter-commit, push repo ke GitHub (public), dan deploy ke Vercel dengan domain production yang stabil (tidak berubah tiap deploy).

## Kriteria Selesai (Definition of Done)

**README.md**
- [ ] Buat file `README.md` di root repo dengan struktur:
  - Judul + tagline singkat
  - Link live demo (placeholder dulu, diisi setelah deploy berhasil)
  - Penjelasan singkat masalah (kebakaran lahan & kabut asap berulang, warga sering tahu dari rumor bukan info resmi) dan solusi LUMI
  - Tabel fitur per peran: Warga, BPBD Provinsi, DLH Provinsi, BNPB, KLH
  - Diagram alur sistem pakai **Mermaid flowchart** (render native di GitHub):
    `Kasus terdeteksi → BPBD verifikasi → DLH pantau AQI & sebar informasi → tindak lanjut (Selesai / Eskalasi ke BNPB)`, dengan cabang opsional terpisah: `DLH → lapor ke KLH → broadcast awareness nasional`
  - Tech stack: Next.js, Supabase (Postgres+Auth+RLS) via Docker, SSE, Leaflet+clustering, pnpm, Playwright
  - Struktur folder (tree singkat)
  - Cara jalanin di lokal (`pnpm install`, `pnpm dev` — otomatis migrate+seed Supabase)
  - Tabel environment variables — **NAMA VARIABLE SAJA, TANPA VALUE ASLI**
  - Instruksi deployment singkat
  - Section placeholder untuk nama lomba (tulis `[Nama Lomba — isi manual]`)
  - Lisensi (placeholder kalau belum ditentukan)
  - Baris penutup paling akhir: **"Dibuat dengan ❤️ oleh Verrel · We love NewJeans 🩷"**
- [ ] Test render diagram Mermaid-nya valid (cek syntax, jangan sampai error di GitHub preview)

**Environment & Keamanan (WAJIB dicek sebelum commit pertama)**
- [ ] Scan semua `process.env.*` di codebase, buat `.env.example` berisi NAMA variable yang benar-benar dipakai, TANPA value asli
- [ ] Cek `.gitignore` — pastikan `.env`, `.env.local`, `.env*.local` semua ter-exclude. Kalau `.gitignore` belum ada atau belum lengkap, tambahkan/buat baru
- [ ] Sebelum `git add`, jalankan `git status` dan pastikan TIDAK ADA file `.env`/`.env.local` yang muncul di daftar

**GitHub**
- [ ] `git init` (kalau belum ada repo git), `git add .`, commit pertama dengan pesan yang jelas
- [ ] Buat repository baru di GitHub dengan visibility **PUBLIC**
- [ ] Push ke branch `main`
- [ ] CATATAN UNTUK AGENT: pembuatan repo & autentikasi GitHub biasanya butuh login interaktif (browser OAuth) atau personal access token. Kalau agent jalan non-interaktif, gunakan `gh auth login` dengan token yang sudah disiapkan, atau minta konfigurasi token dari environment lebih dulu sebelum lanjut — jangan stuck diam kalau login gagal, laporkan ke PM

**Vercel**
- [ ] Install Vercel CLI kalau belum ada (`npm i -g vercel`)
- [ ] Login ke Vercel — catatan sama seperti GitHub, mungkin butuh `VERCEL_TOKEN` untuk mode non-interaktif
- [ ] `vercel link` — coba nama project **"lumi"** dulu. Kalau sudah dipakai orang lain, fallback ke `lumi-kalimantan` atau `lumi-warga`
- [ ] Deploy ke **PRODUCTION** pakai `vercel --prod` (BUKAN cuma `vercel` biasa) — supaya dapat domain stabil `<nama-project>.vercel.app` yang TIDAK berubah tiap deploy
- [ ] Set environment variables di Vercel (dashboard project atau `vercel env add <NAMA>`) sesuai isi `.env.example`, dengan value asli — minta value ini dari user, jangan mengarang
- [ ] Hubungkan GitHub repo ke project Vercel (Settings → Git) supaya auto-deploy jalan otomatis tiap push ke `main` — user tidak perlu jalanin `vercel --prod` manual lagi setelahnya
- [ ] Setelah deploy production berhasil, UPDATE README.md — ganti placeholder link demo dengan URL production yang sebenarnya

## Dikerjakan oleh
`developer` — end-to-end, termasuk bagian GitHub & Vercel (bukan tugas manual user)

## Verifikasi sebelum status "done"
- [ ] Repo GitHub bisa diakses publik (cek di browser incognito/logged-out)
- [ ] Link production Vercel bisa diakses dan stabil (deploy ulang sekali, konfirmasi link TIDAK berubah)
- [ ] `.env`/`.env.local` TIDAK muncul di riwayat commit GitHub sama sekali (cek `git log -p -- .env*` kosong)
- [ ] README.md ter-update dengan link demo asli, bukan placeholder lagi

## Status
in-progress — developer mengerjakan dokumen & keamanan dulu; GitHub push dan Vercel deploy butuh kredensial (token) sebelum bisa lanjut.
