# LUMI - Frontend Product Requirements Document

**Versi:** 0.1  
**Tanggal:** 8 September 2026  
**Status:** spesifikasi MVP turunan dari PRD utama LUMI  
**Audiens:** builder frontend, penulis artikel, dan video owner  
**Teknologi target:** Next.js versi stabil, TypeScript, Tailwind CSS  
**Dokumen induk:** [PRD LUMI](2026-09-07-lumi-prd.md)

---

## 1. Tujuan dokumen

Dokumen ini menerjemahkan keputusan produk LUMI menjadi kebutuhan antarmuka web yang dapat dibangun dalam 10-12 hari. Frontend harus membantu petugas memahami prioritas kualitas udara tanpa merangkum data secara manual, sementara warga menerima informasi yang ringkas, bertimestamp, dan telah disetujui manusia.

MVP membuktikan satu alur utuh:

~~~
data atau simulasi
-> tier prioritas yang dapat dijelaskan
-> review petugas
-> action brief
-> approval Diskominfo
-> informasi tampil di web warga
~~~

Hero demo memakai Pontianak, Kalimantan Barat. Kalimantan Tengah dapat tampil sebagai pembanding dalam ranking nasional.

## 2. Prinsip pengalaman pengguna

1. **Jelas sebelum dekoratif.** Tier, alasan, sumber, timestamp, dan status kesegaran harus lebih mudah ditemukan daripada visual tambahan.
2. **Human-in-the-loop.** Tidak ada UI yang memberi kesan AI, sistem, atau petugas telah melakukan evakuasi maupun mengirim pesan otomatis.
3. **Data jujur.** Data live, kedaluwarsa, tidak tersedia, dan simulasi selalu terlihat berbeda secara tekstual, bukan hanya warna.
4. **Publik dan operasional dipisahkan.** Warga tidak pernah melihat draft, audit log, data kontak, maupun bukti internal; petugas tidak memakai tampilan warga untuk bekerja.
5. **Satu codebase, dua pengalaman.** Satu aplikasi Next.js dan satu API digunakan agar satu builder tidak memelihara dua produk terpisah.
6. **Mobile untuk warga, desktop untuk petugas.** Web warga harus nyaman pada layar 360 px; dashboard mengutamakan pembacaan bukti pada desktop tetapi tetap responsif.

## 3. Batas area aplikasi

Saat domain telah tersedia, LUMI memakai dua subdomain:

~~~
lumi.<domain>      -> web warga, publik, read-only
ops.lumi.<domain>  -> dashboard petugas, login dan akses berbasis peran
~~~

Sebelum DNS/subdomain siap, rute berikut dipakai dalam satu deployment:

~~~
/                  -> web warga
/ops               -> dashboard petugas
~~~

Pemisahan domain atau rute membuat pengalaman lebih jelas, tetapi **bukan** mekanisme keamanan utama. Backend harus memeriksa autentikasi, peran, status approval, dan mode data pada setiap request.

| Area | Akses | Tujuan | Data yang boleh terlihat |
|---|---|---|---|
| Web warga | Tanpa login | Memahami kondisi dan tindakan aman | Hanya informasi berstatus PUBLISHED |
| Dashboard petugas | Login wajib | Meninjau bukti, koordinasi, dan approval | Data operasional sesuai peran |
| Simulation Center | Admin/demo wajib | Menjalankan skenario yang terkendali | Data SIMULASI yang terisolasi |

## 4. Peran dan hak tampilan

| Peran | Tampilan utama | Aksi yang diizinkan | Batas |
|---|---|---|---|
| Warga | Status wilayah dan panduan | Memilih wilayah, membaca panduan, mengisi minat peringatan masa depan | Tidak melihat tier internal yang belum dipublikasikan, draft, atau data kontak |
| Operator DLH | Ranking insiden dan bukti | Meninjau prioritas, menyunting action brief, mengirim draf ke approval | Tidak memublikasikan langsung |
| Koordinator BPBD | Antrean Respons Tinggi | Membaca brief dan konteks eskalasi | Tidak mengubah tier, bukti, atau publikasi |
| Dinkes | Panduan kelompok rentan | Meninjau panduan dan konteks kesehatan preventif | Tidak mengubah tier atau menerbitkan pesan publik |
| Diskominfo | Antrean publikasi | Menyetujui atau menolak draf publik | Tidak mengubah sinyal sumber atau tier |
| Admin/demo | Simulation Center | Menjalankan atau mereset skenario | Tidak dapat menerbitkan hasil SIMULASI |

Untuk MVP, akun demo boleh digunakan. Role switch hanya boleh ada di lingkungan demo, diberi label jelas, dan tidak menggantikan pemeriksaan role di backend.

## 5. Struktur halaman

### 5.1 Web warga

| Rute | Fungsi |
|---|---|
| / | Ringkasan status wilayah pilihan, waktu pembaruan, tindakan utama, dan tautan detail |
| /wilayah/[slug] | Detail status publik untuk satu wilayah |
| /panduan | Panduan per tier serta panduan untuk kelompok rentan |
| /peringatan | Form minat notifikasi masa depan |
| /peringatan/kelola | Form pencabutan consent menggunakan kode pencabutan |
| /tentang-data | Sumber, batas data, cara membaca tier, dan arti data perlu diperbarui |

### 5.2 Dashboard petugas

| Rute | Fungsi |
|---|---|
| /ops/login | Login petugas/demo |
| /ops | Redirect ke antrean insiden |
| /ops/insiden | Ranking wilayah dan antrean prioritas |
| /ops/insiden/[incidentId] | Bukti, alasan tier, action brief, dan workflow publikasi |
| /ops/publikasi | Antrean draf publikasi Diskominfo |
| /ops/simulasi | Simulation Center, hanya admin/demo |
| /ops/simulasi/[runId] | Hasil satu eksekusi simulasi yang tersimpan dan tetap berlabel SIMULASI |
| /ops/akses-ditolak | Tampilan aman untuk role yang tidak berwenang |

MVP tidak memerlukan peta interaktif, chat internal, halaman manajemen pengguna, atau analitik kompleks.

## 6. Kebutuhan web warga

### 6.1 Beranda dan detail wilayah

Setiap status wilayah wajib menunjukkan:

- Nama wilayah dan provinsi.
- Badge tier: Pantau, Verifikasi, atau Respons Tinggi.
- Ringkasan kondisi dalam Bahasa Indonesia sederhana.
- Waktu observasi dan waktu pembaruan.
- Status kesegaran: Data terkini, Data perlu diperbarui, atau Data tidak tersedia.
- Panduan tindakan sesuai tier.
- Panduan khusus anak-anak, lansia, ibu hamil, serta warga dengan penyakit jantung atau paru.
- Ringkasan sumber, misalnya BMKG, OpenAQ, Open-Meteo, atau data demo.
- Data SIMULASI tidak pernah masuk ke halaman warga.

Web warga hanya boleh menampilkan informasi dengan status PUBLISHED. Jika belum ada publikasi yang disetujui, tampilkan:

> Belum ada pembaruan publik yang disetujui untuk wilayah ini. Pantau informasi resmi terbaru dari pemerintah daerah.

Badge tier pada web warga mencerminkan hanya notice PUBLISHED terakhir. Ranking live, tier internal terbaru, evidence rinci, dan draf tetap berada di dashboard petugas.

Jangan pernah memakai kata "aman" hanya karena data tidak tersedia atau data sudah kedaluwarsa.

### 6.2 Form minat peringatan masa depan

Mengakses status publik tidak memerlukan registrasi. Form ini bersifat opt-in.

Field wajib:

- Wilayah pilihan.
- Nomor HP.
- Checkbox persetujuan penggunaan nomor untuk layanan peringatan masa depan.

Teks tetap:

> LUMI belum mengirim WhatsApp atau SMS pada versi MVP. Nomor ini dicatat sebagai minat untuk layanan peringatan masa depan.

Setelah pendaftaran berhasil, server mengembalikan kode pencabutan persetujuan satu kali. UI menampilkannya agar pengguna dapat menyalin/menyimpan sendiri, tetapi tidak menyimpan kode tersebut di local storage. Rute /peringatan/kelola menerima kode itu untuk mencabut consent. MVP tidak memverifikasi OTP atau kepemilikan nomor.

Frontend tidak boleh menebak provider dari prefix nomor, menyimpan nomor di URL/local storage, atau menampilkan nomor utuh setelah tersimpan.

## 7. Kebutuhan dashboard petugas

### 7.1 Daftar insiden

Halaman /ops/insiden menampilkan kartu atau tabel ranking dengan:

- Urutan prioritas dan nama wilayah.
- Tier serta status workflow.
- Nilai PM2.5 atau label ISPU yang jelas sebagai demo/adapter bila bukan sumber resmi.
- Ringkasan arah angin dan cuaca.
- Hotspot dengan frasa "indikasi anomali panas", bukan "kebakaran terkonfirmasi".
- Freshness, waktu observasi, dan waktu pembaruan.
- Alasan singkat mengapa wilayah berada pada tier tersebut.

Filter MVP: tier, wilayah, dan status workflow. Hasil SIMULASI hanya muncul melalui /ops/simulasi, bukan di antrean insiden live.

### 7.2 Detail insiden

Halaman detail memiliki empat blok:

1. **Ringkasan keputusan** - tier, alasan, pemilik tindak lanjut, status workflow, dan timestamp.
2. **Bukti data** - PM2.5, cuaca, arah angin, hotspot bila ada, sumber, waktu observasi, waktu pengambilan, dan freshness.
3. **Action brief** - tindakan terstruktur untuk DLH, BPBD, Dinkes, dan Diskominfo. AI hanya boleh menghasilkan draf dari playbook yang telah disetujui.
4. **Publikasi warga** - draf pesan, status approval, riwayat keputusan, serta tombol yang sesuai role.

| Aksi | DLH | BPBD | Dinkes | Diskominfo |
|---|---:|---:|---:|---:|
| Meninjau bukti | Ya | Ya pada Respons Tinggi | Ya | Ya |
| Edit action brief | Ya | Tidak | Tidak | Tidak |
| Kirim ke approval | Ya | Tidak | Tidak | Tidak |
| Approve/reject publikasi | Tidak | Tidak | Tidak | Ya |
| Mengubah tier | Tidak | Tidak | Tidak | Tidak |

Tier adalah hasil rule engine backend. Petugas dapat menambahkan catatan review tetapi tidak mengubah tier secara manual dalam MVP.

### 7.3 Workflow publikasi

~~~
Draft
-> Menunggu approval Diskominfo
-> Disetujui dan PUBLISHED
-> Tampil di web warga
~~~

Jika ditolak:

~~~
Draft
-> Menunggu approval Diskominfo
-> Ditolak dengan catatan
-> Kembali ke DLH untuk revisi
~~~

Tidak ada tombol "Publikasikan sekarang" untuk DLH. Konfirmasi approval harus menyatakan pesan, role approver, serta timestamp yang akan tercatat.

Pesan PUBLISHED tidak dapat diedit di UI. Perbaikan selalu dimulai sebagai draf/revisi baru; pesan lama tetap terlihat sampai revisi baru disetujui.

## 8. Simulation Center

Simulation Center memakai rule engine yang sama dengan mode live, tetapi semua input dan output terisolasi.

Input inti:

- Wilayah.
- PM2.5.
- Timestamp dan status kesegaran data.
- Kondisi cuaca.
- Arah serta kecepatan angin.
- Jumlah/indikasi hotspot.
- Preset skenario.

Preset minimum:

| Preset | Hasil yang diharapkan |
|---|---|
| Pantau | Kondisi normal/sedang, data segar, tanpa bukti pendukung kuat |
| Verifikasi | PM2.5 memburuk atau angin mendukung dampak; perlu pemeriksaan |
| Respons Tinggi Pontianak | PM2.5 serius, angin relevan, bukti segar; memunculkan eskalasi BPBD |
| Data kedaluwarsa | Menunjukkan Data perlu diperbarui tanpa penurunan risiko diam-diam |

Ketentuan wajib:

- Header, badge, dan detail selalu bertuliskan SIMULASI.
- Tombol publikasi dan kanal notifikasi tidak tersedia atau nonaktif dengan penjelasan.
- Hasil tidak mengubah data live dan tidak muncul pada web warga.
- Live dan simulasi memiliki field mode yang berbeda.
- Tombol reset hanya mengembalikan preset, tidak menghapus data live.
- Status erupsi adalah tambahan setelah PM2.5, angin, dan hotspot selesai.

## 9. Kontrak data frontend

Frontend membaca kontrak internal yang telah dinormalisasi; tidak ada komponen yang membaca payload mentah API eksternal secara langsung.

~~~ts
type PriorityTier = "MONITOR" | "VERIFY" | "HIGH_RESPONSE";
type DataMode = "LIVE" | "SIMULATION";
type Freshness = "FRESH" | "STALE" | "UNAVAILABLE";
type PublicationStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "PUBLISHED";
~~~

Setiap bukti minimum:

~~~ts
type Evidence = {
  id: string;
  kind: "PM25" | "WEATHER" | "WIND" | "HOTSPOT";
  value: string | number | null;
  unit?: string;
  source: string;
  observedAt: string;
  retrievedAt: string;
  freshness: Freshness;
  mode: DataMode;
  note?: string;
};
~~~

Hasil Simulator memakai kontrak terpisah: id run, preset, input, output tier/rationale/data gap/action ID, createdAt, dan mode yang selalu bernilai SIMULATION. Hasil ini hanya dibaca pada /ops/simulasi/[runId], bukan sebagai insiden live.

Payload petugas dapat memuat evidence, rationale, action brief, serta status approval. Payload publik wajib lebih sempit dan tidak boleh memuat draft, audit log, identitas petugas, nomor HP, API key, payload AI mentah, atau detail hotspot yang dapat disalahartikan sebagai kebakaran terkonfirmasi.

## 10. State, error, dan interaksi

- Gunakan Server Components untuk halaman baca data dan Client Components hanya untuk filter, form, approval, serta Simulator.
- Jangan menambahkan state manager global dalam MVP; state server adalah sumber kebenaran.
- Filter disimpan pada URL query parameter agar mudah dibagikan dan direkam saat demo.
- Setelah mutasi berhasil, tampilkan konfirmasi dari server lalu refresh data. Jangan memakai optimistic publish/approval.
- Tombol submit harus nonaktif selama request untuk mencegah klik ganda.

| Kondisi | Tampilan wajib |
|---|---|
| Sumber gagal | Data tidak tersedia dan nama sumber yang gagal |
| Data stale | Data perlu diperbarui, timestamp tetap terlihat |
| 401 | Redirect login |
| 403 | Halaman akses ditolak tanpa membocorkan data |
| 409 | Status telah berubah oleh petugas lain; refresh data |
| 422 | Error validasi pada field terkait |
| 503 | Gangguan sementara dan tombol coba lagi |

## 11. Desain visual dan aksesibilitas

Arah visual adalah layanan publik yang tenang, jelas, dan dapat dipercaya - bukan dashboard bencana yang menakut-nakuti.

- Bahasa utama adalah Bahasa Indonesia.
- Gunakan badge teks dan ikon bersama warna; warna bukan satu-satunya pembeda tier.
- Warna merah dipakai hanya untuk Respons Tinggi, bukan dekorasi.
- Kontras teks minimal setara WCAG AA 4.5:1.
- Semua aksi penting dapat dioperasikan keyboard dengan focus state terlihat.
- Target sentuh minimal 44 x 44 px.
- Tabel dashboard berubah menjadi kartu pada layar kecil.
- Timestamp memakai zona waktu Indonesia secara jelas, misalnya 08 Sep 2026, 14.30 WIB.
- Gunakan heading semantik, label form eksplisit, dan teks error yang manusiawi.
- Jangan menambah peta, grafik, atau animasi jika tidak memperjelas keputusan.

## 12. Keamanan dan batas keselamatan

- Tidak ada perintah evakuasi, diagnosis medis, atau publikasi otomatis.
- Tidak ada WhatsApp, SMS, Telegram, push notification, OTP, atau deteksi provider pada MVP.
- Hotspot selalu dijelaskan sebagai indikator panas yang perlu verifikasi.
- AI hanya membuat draf brief/pesan dari bukti dan playbook; ia tidak menentukan tier.
- Semua status menampilkan sumber, timestamp, serta freshness.
- Data stale tidak boleh tampil seolah-olah risiko telah membaik.
- Data simulasi tidak boleh bocor ke halaman warga.
- Nomor HP selalu disamarkan pada UI petugas.
- API key tidak masuk browser bundle atau environment variable publik.
- Menyembunyikan tombol di frontend tidak cukup; backend tetap memeriksa role dan mode data.

## 13. Di luar ruang lingkup MVP

- Aplikasi mobile native.
- Peta panas, pemrosesan citra satelit, atau prediksi bencana berbasis AI.
- Chatbot dan analitik kompleks.
- Feed status erupsi resmi.
- NASA FIRMS sebelum alur PM2.5 dan angin stabil.
- SSO instansi nyata dan manajemen pengguna.
- Broadcast WhatsApp/SMS atau akses data pelanggan operator.
- WebSocket, pembaruan real-time kompleks, dan load balancer sebagai fitur UI.

## 14. Acceptance criteria

1. Warga dapat membuka / dan /wilayah/pontianak tanpa login dan hanya melihat publikasi PUBLISHED.
2. Status publik memuat tier, tindakan, sumber, timestamp, dan freshness.
3. Warga tidak dapat membuka /ops atau membaca payload internal lewat browser.
4. Operator DLH dapat melihat ranking, alasan tier, dan evidence tanpa merangkum data manual.
5. Respons Tinggi menampilkan action brief serta eskalasi BPBD.
6. Diskominfo dapat approve/reject draf; perubahan muncul di web warga hanya setelah approval sukses.
7. Draft, catatan penolakan, action brief internal, dan nomor HP tidak muncul di halaman publik.
8. Simulation Center menjalankan preset berulang dengan hasil tier konsisten dan label SIMULASI.
9. Simulasi tidak dapat dipublikasikan atau dikirim ke warga.
10. Tampilan dapat dipakai pada 360 px dan desktop, melalui keyboard, serta tanpa mengandalkan warna saja.
11. Error atau stale data tampil eksplisit dan tidak mengklaim kondisi aman.
12. Tidak ada request browser langsung ke Groq, Gemini, atau sumber yang membutuhkan secret key.

## 15. Urutan pengerjaan frontend

1. Buat shell layout publik dan ops, tipe data, serta komponen status awal.
2. Sambungkan daftar/detail insiden ke data simulasi rule engine.
3. Buat action brief dan workflow approval yang berakhir di halaman warga.
4. Buat Simulation Center dengan preset Pontianak dan data kedaluwarsa.
5. Tambahkan form opt-in, states error, aksesibilitas, dan polish demo.
6. Hubungkan data live setelah alur simulasi stabil.
