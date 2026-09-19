# Laporan Status Implementasi LUMI

**Tanggal pembaruan:** 18 September 2026  
**Status:** MVP lokal telah dibangun; belum siap menjadi layanan pemerintah produksi.

## 1. Ringkasan eksekutif

LUMI adalah web app pendukung keputusan untuk membantu pemerintah daerah merespons risiko kualitas udara akibat kabut asap/kebakaran, abu vulkanik, dan indikasi banjir. Fokus utamanya bukan memberi perintah evakuasi otomatis atau memprediksi bencana, melainkan menyatukan data, menjelaskan prioritas wilayah, dan membantu petugas menyusun tindakan serta informasi publik yang perlu disetujui manusia.

Versi saat ini sudah memiliki tiga aplikasi lokal yang saling terhubung ke satu backend:

| Aplikasi | Pengguna | Peran utama | Port lokal |
| --- | --- | --- | --- |
| Ops LUMI | DLH, BPBD, Diskominfo | Memantau risiko, meninjau insiden, dan menjalankan alur operasional | `3000` |
| Portal Warga | Warga | Membaca informasi publik yang sudah disetujui | `3001` |
| Admin Simulator | Admin demo | Mengirim data simulasi ke backend, tanpa fungsi operasional lain | `3002` |
| Government API | Ketiga aplikasi di atas | Autentikasi, evaluasi risiko, data, dan aturan akses | `4000` |

Saat laporan ini dibuat, backend pada port `4000` **tidak sedang merespons**. Artinya UI dapat dibuka jika dev server dijalankan, tetapi login, pengiriman simulasi, dan pembaruan data membutuhkan backend dihidupkan kembali.

## 2. Masalah dan arah produk yang telah dipilih

Masalah inti yang menjadi dasar LUMI:

`data terpisah → prioritas wilayah/tindakan tidak jelas → respons lintas instansi terlambat → informasi publik terlambat → kelompok rentan menghadapi risiko lebih besar`

Ruang lingkup MVP yang dipilih:

1. Kualitas udara sebagai indikator utama: AQI dan PM2.5.
2. Risiko kabut asap/kebakaran sebagai indikator tambahan.
3. Indikasi abu vulkanik dan banjir sebagai pilihan simulasi tambahan.
4. Kalimantan sebagai cakupan fase pertama, agar demo tetap dapat diuji dan dijelaskan dengan baik.
5. Keputusan berbasis aturan yang transparan, bukan prediksi AI yang tidak dapat dijelaskan.

## 3. Yang sudah dibangun

### 3.1 Fondasi teknis

- Monorepo TypeScript dengan `pnpm` agar dependensi dan instalasi tetap ringan.
- `apps/web` memakai Next.js 16, React 19, Tailwind, Leaflet/react-leaflet, dan driver.js.
- `packages/contracts` menyimpan kontrak data/validasi bersama antara frontend dan backend.
- `backend/government` adalah API Node.js untuk autentikasi, data insiden, prioritas, audit, dan proyeksi publik.
- Tiga aplikasi web dipisahkan secara operasional melalui entry dan build directory berbeda, walaupun masih berada pada satu repository.

### 3.2 Dashboard petugas pemerintah (Ops)

Dashboard pada `http://localhost:3000` telah memiliki:

- Login berbasis peran DLH, BPBD, dan Diskominfo.
- Dashboard insiden/peta risiko untuk melihat kondisi wilayah.
- Tampilan AQI dan PM2.5 serta tier prioritas.
- Peta Leaflet dengan titik kota/kabupaten Kalimantan, filter provinsi, zoom, fullscreen, dan radius dampak.
- Warna AQI yang konsisten: hijau (0–50), kuning (51–100), oranye (101–150), merah (151–200), ungu (201–300), marun (301–500), dan abu-abu (belum ada data).
- Simbol bahaya dipisahkan dari warna AQI agar kebakaran, abu vulkanik, atau banjir tidak disalahartikan sebagai nilai kualitas udara.
- Detail indikator, alasan prioritas, dan rekomendasi tindakan yang dapat dipahami petugas.
- Pengaturan dasar: mode terang/gelap, ukuran teks, kepadatan tampilan, nama, dan avatar.
- Penanganan backend tidak aktif: halaman tidak lagi berhenti di teks “Menyiapkan visualisasi risiko”, melainkan menampilkan status gangguan dan tombol coba lagi.

### 3.3 Portal warga

Portal warga pada `http://localhost:3001` telah dirancang sebagai tampilan terpisah dari dashboard pemerintah:

- Hanya menampilkan informasi publik yang sudah disetujui/published.
- Tidak mengekspos data mentah simulasi, bukti internal, audit trail, atau action brief petugas.
- Memuat panduan tindakan berbasis tier risiko.
- Memiliki pengaturan visual dasar, termasuk preferensi tema dan aksesibilitas.

Portal ini belum melakukan pengiriman notifikasi nyata ke nomor telepon, WhatsApp, SMS, Telegram, atau push notification.

### 3.4 Admin Simulator

Admin Simulator pada `http://localhost:3002/ops/login` sengaja dipisahkan secara visual dan fungsional dari dashboard pemerintah.

Fungsinya hanya untuk mengirim data palsu demi demonstrasi. Form saat ini dibatasi pada:

1. Provinsi serta kota/kabupaten di Kalimantan.
2. AQI dari 0 sampai 500.
3. Satu bahaya opsional: `FIRE`, `VOLCANIC_ASH`, atau `FLOOD`.
4. Tingkat keparahan bahaya 1 sampai 5 apabila bahaya dipilih.

Sistem kemudian menghitung estimasi PM2.5 dari AQI dan menentukan tier secara internal. Simulator tidak dapat mengirim perintah evakuasi, mempublikasikan pesan, atau menghubungi warga.

Aturan prioritas yang telah diterapkan pada demo:

| Kondisi | Hasil minimum |
| --- | --- |
| AQI di bawah 151 tanpa bahaya berat | Pantau (`MONITOR`) |
| Bahaya tingkat 1–2 | Verifikasi (`VERIFY`) |
| AQI 151 atau lebih | Respons Tinggi (`HIGH_RESPONSE`) |
| Bahaya tingkat 3–5 | Respons Tinggi (`HIGH_RESPONSE`) |

Semua bahaya dari simulator disebut **indikasi**, bukan kejadian bencana yang sudah terverifikasi.

### 3.5 Cakupan wilayah dan peta

- Katalog lokasi memuat 56 kota/kabupaten di lima provinsi Kalimantan.
- Kalimantan Barat: 14 wilayah.
- Kalimantan Tengah: 14 wilayah.
- Kalimantan Selatan: 13 wilayah.
- Kalimantan Timur: 10 wilayah.
- Kalimantan Utara: 5 wilayah.
- Peta menggunakan titik referensi lokasi dan bukan mengklaim memiliki batas administratif resmi.

### 3.6 Autentikasi, akses, dan keamanan dasar

- Login memakai session cookie opaque yang dikelola server, bukan token yang disimpan di local storage.
- Lima akun Supabase Auth lokal menggunakan satu `DEMO_PASSWORD` yang dibuat
  secara kriptografis oleh `pnpm setup:local-env` dan tidak pernah dicetak.
- Fixture API lama sementara menerima variabel kompatibilitas yang dibuat dari
  secret yang sama sampai adapter persisten dikerjakan pada Stage 2.
- Peran ditentukan dari identitas server, bukan dari role yang dikirim browser.
- Mutasi API memeriksa origin operasional yang diizinkan.
- Portal publik hanya membaca data berstatus `PUBLISHED`.
- Bukti, draft, audit, session, dan hasil simulator tidak boleh bocor ke endpoint publik.
- Perbaikan stale session sudah ditambahkan agar sesi simulator lama setelah backend restart tidak tampak valid lalu gagal secara membingungkan.

### 3.7 Akun demo lokal

Lima akun lokal menggunakan satu password dari environment `DEMO_PASSWORD`.
Nilainya hanya berada di `.env.local` yang diabaikan Git dan bermode `0600`.

| Jenis akun | Email | Jabatan demo |
| --- | --- | --- |
| DLH | `operator.dlh@demo.lumi.id` | Operator & Validator Kualitas Udara |
| BPBD | `koordinator.bpbd@demo.lumi.id` | Koordinator Respons Risiko |
| Diskominfo | `approver.diskominfo@demo.lumi.id` | Approver Informasi Publik |
| Admin Simulator | `simulator@demo.lumi.id` | Administrator Simulation Center |
| Warga | `amelia.warga@demo.lumi.id` | Warga demo |

Kredensial ini hanya untuk walkthrough lokal. Kredensial tersebut wajib diganti dan dikelola melalui environment variable sebelum deployment.

### 3.8 Pengujian yang sudah dilakukan

Verifikasi terakhir yang telah berhasil dijalankan setelah penyederhanaan simulator:

| Pemeriksaan | Hasil |
| --- | --- |
| `pnpm test` | Lulus: 35 test (7 contracts, 28 government API) |
| `pnpm typecheck` | Lulus |
| `pnpm build:ops` | Lulus |
| `pnpm build:simulator` | Lulus |
| Uji alur API langsung | Lulus: simulator mengirim Banjarmasin AQI 184 + `FIRE` severity 3 dan Ops menerima `HIGH_RESPONSE` |

Uji browser end-to-end penuh belum dapat diklaim selesai karena bukti dari helper browser sebelumnya belum konklusif.

## 4. Cara menjalankan secara lokal

Instalasi awal:

```bash
pnpm install
```

Jalankan `pnpm supabase:start`, `pnpm setup:local-env`, lalu `pnpm seed:demo`
untuk menyiapkan database dan Auth lokal. Stage 1 belum mengganti fixture API;
perintah dev server yang sudah ada tetap tersedia di `package.json` dan rincian
backend ada di `backend/government/README.md`.

Setelah semua berjalan, buka:

```text
Ops pemerintah:       http://localhost:3000/ops/login
Portal warga:         http://localhost:3001
Admin Simulator:      http://localhost:3002/ops/login
Government API:       http://localhost:4000
```

Jika Simulator menampilkan pesan bahwa data belum terkirim, periksa dua hal: backend port `4000` harus aktif dan sesi Admin Simulator harus masih berlaku.

## 5. Yang belum dibangun

Bagian berikut **belum ada** dan tidak boleh disebut sebagai fitur aktif saat demo:

### 5.1 Data dan integrasi eksternal

- Ingest data live BMKG.
- Cuaca/arah angin live dari Open-Meteo atau sumber resmi lain.
- NASA FIRMS untuk indikator hotspot.
- Feed status gunung api resmi.
- Sinkronisasi batas administrasi resmi kota/kabupaten, termasuk Geoapify atau sumber batas resmi lainnya.
- Geocoding alamat sampai kelurahan pada titik insiden.
- Scheduler/background worker untuk pembaruan data otomatis.

### 5.2 Infrastruktur produksi

- Database persisten; runtime saat ini memakai penyimpanan memori.
- Aktivasi dan migrasi Supabase untuk produksi. File migrasi sudah ada, tetapi tidak dijalankan oleh P0.
- Deployment VPS.
- Nginx/reverse proxy HTTPS produksi.
- Load balancer dan strategi horizontal scaling.
- Monitoring, backup, observability, dan disaster recovery.

### 5.3 Fitur komunikasi dan institusi nyata

- SSO atau integrasi resmi dengan instansi pemerintah.
- Broadcast WhatsApp, SMS, Telegram, web push, atau kanal operator telekomunikasi.
- Deteksi provider nomor telepon, verifikasi nomor, opt-in, dan manajemen persetujuan warga.
- Pengiriman notifikasi publik secara nyata.
- Integrasi command center/layanan darurat.
- Perintah evakuasi atau publikasi otomatis.

### 5.4 AI dan analitik lanjutan

- API model AI untuk membuat draf ringkasan/action brief.
- Benchmark pemilihan model AI.
- Prediksi kualitas udara atau prediksi kebakaran/erupsi.
- Validasi ilmiah model prediksi dan proses human review-nya.

### 5.5 Cakupan produk

- Seluruh Indonesia di luar Kalimantan.
- Aplikasi mobile native.
- Poligon batas wilayah berwarna sesuai kondisi. Saat ini warna risiko tampil pada titik lokasi dan radius dampak, bukan sebagai batas administratif resmi.
- Pengujian E2E browser otomatis yang lengkap.

## 6. Batasan dan risiko yang harus dijelaskan saat presentasi

1. **Data simulator bukan data lapangan.** Semua input simulator harus disebut data demo LUMI.
2. **Hotspot bukan bukti kebakaran.** Hotspot satelit atau sinyal panas hanya indikasi yang perlu verifikasi.
3. **Tidak ada perintah otomatis.** LUMI membantu koordinasi; keputusan dan publikasi tetap berada pada petugas berwenang.
4. **Peta belum berbatas resmi.** Titik lokasi berguna untuk demonstrasi prioritas, tetapi bukan dasar legal penanganan administratif.
5. **Belum produksi.** Penyimpanan memori akan hilang ketika backend di-restart dan belum aman sebagai basis layanan pemerintah nyata.
6. **Kredensial demo tidak boleh dipakai deployment.** Seluruh password demo
   wajib dibuat melalui environment lokal dan tidak boleh digunakan sebagai
   kredensial produksi.

## 7. Urutan pengerjaan lanjutan yang disarankan

1. Pastikan semua service lokal dapat dinyalakan melalui satu workflow dev yang terdokumentasi dan lakukan uji browser tiga aplikasi.
2. Ganti penyimpanan memori ke Supabase melalui migrasi terkontrol dan environment secret yang aman.
3. Tambahkan satu sumber data live terlebih dahulu, disarankan kualitas udara/cuaca, dengan label sumber dan waktu pembaruan yang jelas.
4. Tambahkan batas administratif resmi serta geocoding sebelum menggunakan tampilan untuk pengambilan keputusan lokasi yang lebih detail.
5. Integrasikan alert publik hanya setelah workflow persetujuan, privacy, opt-in, dan kerja sama kanal resmi selesai.
6. AI dapat ditambahkan paling akhir sebagai pembuat draf yang selalu dapat ditinjau manusia, bukan mesin keputusan risiko.

## 8. Dokumen dan kode acuan

- PRD produk: `docs/superpowers/specs/2026-09-07-lumi-prd.md`
- PRD frontend: `docs/superpowers/specs/2026-09-08-lumi-frontend-prd.md`
- PRD backend: `docs/superpowers/specs/2026-09-08-lumi-backend-prd.md`
- Panduan Government API: `backend/government/README.md`
- Perintah proyek: `package.json`

---

**Kesimpulan:** LUMI sudah mencapai tahap MVP demonstratif yang memisahkan portal pemerintah, warga, dan simulator; memiliki aturan prioritas yang dapat dijelaskan; serta menjaga data publik tetap terbatas pada informasi yang disetujui. Tahap berikutnya adalah membuatnya reliabel di lokal, lalu menambahkan data nyata dan infrastruktur produksi secara bertahap tanpa mengorbankan keamanan atau persetujuan manusia.
