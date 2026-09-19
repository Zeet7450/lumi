# LUMI - Backend Product Requirements Document

**Versi:** 0.1  
**Tanggal:** 8 September 2026  
**Status:** spesifikasi MVP turunan dari PRD utama LUMI  
**Audiens:** builder backend/full-stack dan reviewer teknis  
**Teknologi target:** Next.js stabil, TypeScript, PostgreSQL, Docker Compose, VPS  
**Dokumen induk:** [PRD LUMI](2026-09-07-lumi-prd.md)

---

## 1. Tujuan backend

Backend LUMI adalah sumber kebenaran untuk data kualitas udara yang telah dinormalisasi, keputusan tier yang dapat dijelaskan, workflow antar-instansi, dan informasi warga yang disetujui manusia.

Backend harus menghasilkan alur berikut:

~~~
data sumber atau simulasi
-> normalisasi + freshness
-> rule engine deterministik
-> incident dan action brief
-> review / approval manusia
-> proyeksi data publik yang aman
~~~

LUMI bukan sistem komando darurat. Backend tidak boleh mengeluarkan perintah evakuasi, diagnosis kesehatan, publikasi otomatis, atau pengiriman WhatsApp/SMS.

## 2. Keputusan arsitektur MVP

LUMI dibangun sebagai satu deployment Next.js dan satu database PostgreSQL. Web warga serta dashboard petugas memakai backend yang sama, tetapi API mengembalikan proyeksi data yang berbeda menurut aksesnya.

~~~
Sumber data / Simulation Center
             |
             v
  normalizer -> rule engine -> PostgreSQL -> API internal
                                      |             |
                                      v             v
                              ops.lumi.<domain>  lumi.<domain>
                              petugas terautentik publik read-only
~~~

Komponen Docker Compose:

| Komponen | Tanggung jawab | Batas |
|---|---|---|
| Nginx | HTTPS, reverse proxy, header keamanan, rate limiting publik | Bukan load balancer pada MVP |
| App Next.js | UI, route handlers, autentikasi, API, workflow | Tidak menyimpan secret di browser |
| Worker scheduler | Mengambil dan menormalisasi data pada interval yang sesuai | Satu replika; tidak memakai queue/Redis pada MVP |
| PostgreSQL | Data operasional, audit, approval, dan opt-in | Tidak dibuka ke internet |
| Volume backup | Volume database dan dump sebelum demo/final recording | Tidak menggantikan backup multi-region produksi |

Satu VPS cukup untuk MVP. Load balancer baru dibutuhkan setelah ada dua atau lebih instance aplikasi; menambahkannya sekarang tidak meningkatkan keamanan maupun reliabilitas demo secara berarti.

## 3. Invarian produk yang tidak boleh dilanggar

1. Rule engine - bukan AI dan bukan UI - menentukan Pantau, Verifikasi, atau Respons Tinggi.
2. Setiap tier menyimpan alasan, sumber, waktu observasi, waktu pengambilan, dan status kesegaran data.
3. Hotspot adalah indikasi anomali panas, bukan kebakaran terkonfirmasi.
4. Data stale tidak boleh membuat tier turun atau menghasilkan kesan kondisi aman secara diam-diam.
5. Publik hanya menerima data yang sudah PUBLISHED; draft dan bukti internal tidak pernah ikut serialisasi publik.
6. Hanya Diskominfo yang dapat menyetujui atau menolak publikasi; DLH hanya mengirim draf ke antrean approval.
7. Hasil Simulation Center tidak dapat dibuat menjadi incident live, publication, atau notifikasi.
8. Nomor HP hanya disimpan setelah opt-in warga dan tidak pernah dikirim ke model AI.
9. API key, kredensial, dan data kontak tidak pernah dikirim ke browser.
10. Kegagalan AI, API sumber, atau scheduler menghasilkan perilaku yang aman dan terlihat, bukan klaim data baru.

## 4. Boundary akses dan autentikasi

| Pihak | Akses backend | Aturan |
|---|---|---|
| Warga | Endpoint publik read-only dan endpoint opt-in | Tidak memerlukan login untuk status publik |
| DLH | Insiden, bukti, action brief, submit approval | Tidak dapat approve/publish |
| BPBD | Brief Respons Tinggi | Tidak dapat mengubah tier atau evidence |
| Dinkes | Brief dan panduan rentan | Read-only pada MVP; tidak dapat publish |
| Diskominfo | Antrean draf, approve/reject | Tidak dapat mengganti evidence/tier |
| Admin/demo | Simulation Center | Tidak dapat membawa hasil simulasi ke publik |
| Worker | Fungsi ingestion internal | Tidak memiliki endpoint publik biasa |

MVP memakai session server-side dan role pada server untuk akun demo. Role yang diklaim browser tidak boleh dipercaya. Sesi petugas memakai cookie host-only berawalan __Host- saat HTTPS aktif, dengan atribut HttpOnly, Secure, dan SameSite. Endpoint mutasi memeriksa autentikasi, peran, Origin yang sama, serta schema input. Tidak ada CORS wildcard.

## 5. Model domain dan penyimpanan data

Gunakan PostgreSQL dengan migration yang terversi. Nama tabel dapat menyesuaikan implementasi, tetapi pemisahan tanggung jawab berikut wajib dipertahankan.

| Entitas | Data inti | Tujuan |
|---|---|---|
| regions | id, slug, nama, provinsi, koordinat | Daftar wilayah demo/live |
| source_snapshots | region_id, jenis sinyal, nilai/unit, sumber, observed_at, retrieved_at, freshness, payload ringkas | Jejak data yang sudah dinormalisasi |
| priority_decisions | region_id, tier, rationale, evidence ids, policy_version, decided_at | Keputusan rule engine yang dapat dijelaskan |
| incidents | region_id, decision_id, workflow_status, data_version, updated_at | Objek kerja petugas |
| action_briefs | incident_id, action cards, owner, status, generated_from | Brief lintas instansi |
| public_notices | incident_id, region_id, draft_text, status, revision, submitted_by, approved_by, approved_at, rejection_note, published_at, superseded_at | Workflow draf, approval, dan publikasi informasi warga |
| audit_events | actor, action, entity, before/after ringkas, timestamp | Jejak aksi sensitif |
| notification_interests | region_id, phone_ciphertext, phone_hash, consent_at, withdrawal_at, revocation_token_hash | Opt-in masa depan; tidak ada pengiriman pada MVP |
| users | demo identity, role, session/account data minimum | Akses petugas/demo |
| simulation_runs | preset, input, output, policy_version, created_at | Ruang data SIMULASI terpisah |

### 5.1 Data publik sebagai projection

Endpoint publik tidak boleh mengembalikan record incident secara mentah. Ia membuat projection berisi:

- wilayah;
- tier dan ringkasan yang telah disetujui;
- status published;
- panduan tindakan;
- panduan kelompok rentan;
- sumber ringkas, noticePublishedAt, dataObservedAt, dan currentFreshness.

Projection publik tidak memuat draft, action brief, rejection note, audit event, identitas petugas, nomor HP, detail API, atau respons AI mentah.

### 5.2 Data nomor HP

Nomor HP bukan syarat untuk membaca informasi publik. Jika warga secara sadar mengaktifkan peringatan masa depan:

- validasi hanya format nomor yang wajar; tidak ada OTP atau deteksi provider;
- simpan terenkripsi saat tersimpan dan tampilkan dalam bentuk tersamarkan;
- pisahkan aksesnya dari query dashboard normal;
- simpan hash nomor untuk deduplikasi tanpa membuka plaintext;
- keluarkan kode pencabutan acak satu kali, simpan hanya hash kode itu, dan izinkan pencabutan memakai kode tersebut;
- jangan masukkan nomor ke audit payload, analytics, error response, prompt AI, atau log aplikasi.

## 6. Rule engine prioritas

Rule engine adalah fungsi murni yang menerima snapshot terstandardisasi dan mengembalikan keputusan yang sama untuk input yang sama.

Input minimum:

- PM2.5 dan metadata sumber.
- cuaca serta arah/kecepatan angin.
- observed_at, retrieved_at, dan freshness.
- hotspot opsional sebagai indikator pendukung.
- mode LIVE atau SIMULATION.

Output minimum:

~~~
{
  tier: "MONITOR" | "VERIFY" | "HIGH_RESPONSE",
  rationale: ["PM2.5 segar meningkat dan arah angin perlu ditinjau"],
  evidenceIds: ["obs-pontianak-pm25-001"],
  dataGaps: ["Hotspot belum tersedia untuk periode ini"],
  ownerHints: ["DLH", "BPBD", "DINKES", "DISKOMINFO"],
  policyVersion: "ruleset-v1"
}
~~~

### 6.1 Aturan operasional

| Tier | Kondisi konseptual | Respons backend |
|---|---|---|
| Pantau | Data segar normal/sedang atau hanya satu sinyal awal tanpa dukungan lain | Catat keputusan dan jadwalkan pembaruan |
| Verifikasi | Kualitas memburuk, arah angin relevan, data konflik, atau bukti belum lengkap | Buat incident untuk review DLH dan tandai data gap |
| Respons Tinggi | Kondisi kualitas udara serius, bukti pendukung relevan, dan data masih segar | Prioritaskan incident, buat action brief, tampilkan eskalasi BPBD, siapkan draf publik |

### 6.2 Ruleset-v1 untuk simulator dan demo

Ruleset-v1 memakai PM2.5 dalam ug/m3. Ini adalah policy demo LUMI yang dapat diuji, bukan kategori ISPU resmi dan bukan rekomendasi operasional pemerintah. Threshold berada di satu modul policy yang terversi; tidak ada UI admin untuk mengubahnya pada MVP.

| Sinyal | Fresh bila | Catatan |
|---|---:|---|
| Pembacaan stasiun PM2.5 | Maksimal 3 jam dari observed_at | Dapat menjadi bukti utama |
| Estimasi PM2.5 regional | Maksimal 15 jam dari pembaruan sumber | Berlabel estimasi model, bukan ISPU resmi |
| BMKG cuaca/angin | Maksimal 6 jam | Sinyal pendukung saja |
| NASA FIRMS | Maksimal 12 jam | Indikasi panas untuk verifikasi |
| Fixture simulasi | Sesuai timestamp scenario | Dipakai hanya di Simulation Center |

| Kondisi input | Output ruleset-v1 |
|---|---|
| PM2.5 segar kurang dari 35.5 ug/m3 tanpa sinyal konflik | Pantau |
| PM2.5 segar 35.5 hingga kurang dari 55.5 ug/m3 | Verifikasi |
| Satu hotspot, walaupun fresh | Verifikasi; tidak mengonfirmasi kebakaran |
| PM2.5 segar minimal 55.5 ug/m3 tanpa dukungan lain | Verifikasi |
| PM2.5 segar minimal 55.5 ug/m3 dengan dua pembacaan tinggi berjarak minimal satu jam | Respons Tinggi |
| PM2.5 segar minimal 55.5 ug/m3, hotspot cluster relevan, dan arah angin mendukung dampak ke wilayah | Respons Tinggi |
| PM2.5 segar minimal 150 ug/m3 dari pembacaan stasiun atau fixture simulasi | Respons Tinggi |
| PM2.5 hanya dari estimasi model | Tidak dapat sendiri menaikkan ke Respons Tinggi; butuh bukti segar tambahan |
| PM2.5 stale/tidak tersedia | Tidak membuat tier baru; tampilkan Data perlu diperbarui dan jangan menurunkan keputusan terakhir |

Untuk ruleset-v1, hotspot cluster relevan berarti minimal tiga deteksi FIRMS yang berbeda dalam radius 25 km dari wilayah selama 12 jam terakhir. Arah angin hanya dipakai sebagai sinyal pendukung setelah normalizer menilai arahnya mengarah ke wilayah. Ia tidak membuktikan sumber asap.

Fixture expected-output yang wajib disimpan:

| Fixture | Ringkasan input | Hasil |
|---|---|---|
| monitor-pontianak | PM2.5 20 ug/m3, stasiun fresh, tanpa dukungan | Pantau |
| verify-kalteng | PM2.5 42 ug/m3, stasiun fresh | Verifikasi |
| high-pontianak | PM2.5 72 ug/m3, stasiun fresh, cluster relevan, angin mendukung | Respons Tinggi |
| stale-pontianak | PM2.5 terakhir 72 ug/m3 namun sudah 5 jam | Data perlu diperbarui; tidak membuat tier lebih rendah |

Aturan tambahan:

- Data hilang atau stale tidak boleh otomatis menghasilkan Pantau.
- Sinyal hotspot tunggal paling tinggi menambah kebutuhan Verifikasi; ia tidak membuktikan kebakaran dan bukan pemicu tunggal Respons Tinggi.
- Hubungan sebab-akibat antara hotspot dan PM2.5 tidak boleh diklaim bila bukti tidak mendukung.
- Status erupsi tidak masuk rule awal. Ia hanya ditambahkan setelah slice PM2.5, cuaca, angin, dan hotspot selesai.

## 7. Data ingestion dan freshness

Urutan integrasi:

1. Fixture simulasi terkurasi untuk hero demo.
2. PM2.5: OpenAQ bila tersedia pembacaan stasiun yang segar; fallback Open-Meteo CAMS diberi label estimasi regional, bukan ISPU resmi.
3. Cuaca dan arah angin dari BMKG dengan cache dan atribusi.
4. NASA FIRMS opsional setelah dua sumber inti stabil.
5. Feed status erupsi resmi adalah roadmap.

Setiap adapter sumber harus:

- melakukan timeout pendek dan retry terbatas;
- menormalisasi satuan serta waktu ke format internal;
- menyimpan source, observed_at, retrieved_at, dan freshness;
- cache sesuai ritme pembaruan sumber;
- tidak membuat request dari browser;
- menyimpan error ringkas yang aman untuk operator;
- tidak menimpa snapshot terakhir yang valid dengan payload gagal.

Jika fetch gagal, gunakan snapshot terakhir hanya dengan status STALE dan tampilkan "Data perlu diperbarui". Jangan mengisi angka perkiraan yang seolah-olah berasal dari sumber resmi.

## 8. API contract MVP

Nama path dapat berubah mengikuti konvensi Next.js, tetapi boundary dan izin berikut wajib ada.

| Endpoint | Akses | Perilaku |
|---|---|---|
| GET /api/public/regions/[slug] | Publik | Projection status PUBLISHED saja |
| GET /api/public/guidance | Publik | Panduan tier dan kelompok rentan yang telah disetujui |
| POST /api/public/notification-interests | Publik | Menyimpan opt-in dan mengembalikan kode pencabutan satu kali |
| POST /api/public/notification-interests/revoke | Publik | Mencabut consent menggunakan kode pencabutan opaque |
| GET /api/ops/incidents | Petugas | Ranking/filter insiden sesuai role |
| GET /api/ops/incidents/[id] | Petugas | Detail evidence, rationale, action brief, publication |
| PATCH /api/ops/incidents/[id]/brief | DLH | Menyimpan action brief dan catatan review |
| POST /api/ops/incidents/[id]/submit-publication | DLH | Membuat atau memperbarui draf PENDING_APPROVAL |
| POST /api/ops/publications/[id]/approve | Diskominfo | Menyetujui dan secara atomik menerbitkan draf live menjadi PUBLISHED |
| POST /api/ops/publications/[id]/reject | Diskominfo | Menolak dengan catatan; kembali ke DLH |
| POST /api/ops/simulations | Admin/demo | Menjalankan rule engine terhadap data terisolasi |
| GET /api/ops/simulations/[runId] | Admin/demo | Membaca satu hasil simulasi yang tersimpan |
| POST /api/ops/refresh | Admin/demo | Refresh manual untuk demo, dengan RBAC dan audit |

Ketentuan endpoint:

- Semua input mutasi tervalidasi schema sebelum query database.
- Semua response memakai tipe internal yang eksplisit; tidak meneruskan payload provider.
- Endpoint public notice approve memeriksa status sebelumnya, mode LIVE, role Diskominfo, dan versi record.
- Jika data/approval telah berubah, response 409 memberi tahu UI untuk refresh; tidak menimpa perubahan lain.
- Worker memanggil modul ingestion langsung, bukan HTTP endpoint internal.
- Refresh manual hanya melalui endpoint Admin/demo yang diaudit.
- Tidak ada endpoint send notification, publish simulator, atau manual set tier.

## 9. Workflow incident dan publikasi

### 9.1 State minimum

~~~
priority decision
-> incident OPEN
-> action brief DRAFT
-> publication PENDING_APPROVAL
-> PUBLISHED
~~~

Jalur penolakan:

~~~
PENDING_APPROVAL
-> REJECTED dengan catatan
-> DLH merevisi draf
-> PENDING_APPROVAL
~~~

Record approval memakai expected status dan revision/version untuk mencegah dua approver atau request ulang mengubah hasil secara tak sengaja. Approval dan publish dilakukan dalam satu transaksi database yang sama: pesan PUBLISHED sebelumnya untuk wilayah tersebut diberi superseded_at, lalu draf baru menjadi PUBLISHED. Hanya satu public notice aktif per wilayah.

Record PUBLISHED bersifat immutable. Perbaikan pesan selalu membuat draf/revisi baru; pesan publik lama tetap terlihat sampai revisi baru disetujui. Semua perpindahan state ditulis ke audit_events dalam transaksi yang sama.

### 9.2 Action brief

Action brief memakai action_id dari katalog playbook, bukan rekomendasi bebas dari model. Kartu tindakan minimum:

- DLH: cek kesegaran data dan koordinasi pemeriksaan.
- BPBD: tampil hanya pada Respons Tinggi sebagai koordinasi eskalasi demo.
- Dinkes: panduan kelompok rentan dan kesiapan informasi kesehatan.
- Diskominfo: tinjau kejelasan/approval draf publik.

## 10. Simulation Center yang terisolasi

Simulation Center memakai fungsi normalizer dan rule engine yang sama agar hasilnya representatif, tetapi tidak memakai tabel incident/public_notice live.

Aturan isolasi:

- Input dan output tersimpan pada simulation_runs terpisah.
- Semua output memiliki mode SIMULATION dan policy_version.
- Tidak ada endpoint yang menerima simulation_run_id untuk membuat publication.
- Query publik selalu hanya membaca row live yang PUBLISHED.
- Endpoint Simulation Center menolak upaya membuat draft publik atau mendaftarkan notifikasi.
- Audit event mencatat eksekusi simulasi tanpa membuatnya seolah-olah data live.

Preset minimum: Pantau, Verifikasi, Respons Tinggi Pontianak, dan Data Kedaluwarsa. Nilai fixture harus disimpan agar video bisa direkam ulang dengan hasil konsisten.

## 11. LLM dan batas AI

AI bersifat opsional dan bukan dependensi rule engine. Satu panggilan model hanya terjadi ketika terdapat perubahan insiden material atau operator meminta draf baru - bukan pada setiap polling data.

Input model:

- evidence yang sudah dinormalisasi;
- tier yang sudah diputuskan sistem;
- action_id dari playbook;
- template Bahasa Indonesia;
- source/timestamp/freshness yang dapat disebut secara terbatas.

Output model harus melalui JSON schema, server-side validation, dan batas panjang. Bentuk minimum:

~~~
{
  summary: "PM2.5 Pontianak memburuk; data angin masih segar.",
  dataGaps: ["Data hotspot belum tersedia untuk periode ini"],
  actionIds: ["CHECK_FRESHNESS", "PREPARE_PUBLIC_GUIDANCE"],
  publicDraft: "Kualitas udara di Pontianak memburuk. Kurangi aktivitas luar ruang bila memungkinkan.",
  requiresHumanApproval: true
}
~~~

Model tidak dapat mengubah tier, evidence id, action_id di luar katalog, status approval, atau status publikasi. Pada timeout, quota/API error, JSON invalid, atau data stale, backend memakai template deterministik dan menandai "AI draft unavailable".

Untuk MVP, Groq Free Plan dapat menjadi kandidat utama dan Gemini Flash-Lite kandidat benchmark/cadangan. API key hanya ada di environment server. Jangan kirim nomor HP atau PII ke provider. Free tier selalu diperlakukan sebagai kuota demo, bukan fondasi produksi.

## 12. Keamanan, privasi, dan observabilitas

- Database hanya dapat diakses jaringan internal Docker; tidak ada port PostgreSQL publik.
- Semua secret berada di environment file di VPS yang tidak masuk repository.
- Nginx menambahkan HTTPS, security headers, ukuran request wajar, dan rate limit endpoint publik.
- Validasi server-side dilakukan untuk semua form, filter, approve/reject, simulator, dan opt-in.
- PII dimasking pada output API serta log.
- Respons ops, session, dan opt-in memakai Cache-Control: private, no-store. Hanya projection publik yang sudah disanitasi boleh memakai cache pendek.
- Audit log menyimpan siapa/role apa yang mengubah action brief atau approval, tanpa menyimpan secret/nomor penuh.
- Log terstruktur mencatat request id, operasi, status, durasi, source name, dan error category.
- Error response publik tidak membocorkan SQL, stack trace, API key, internal host, atau role detail.
- Sebelum final demo, export fixture dan lakukan pg_dump database untuk recovery sederhana.

## 13. Deployment VPS

Urutan deploy:

1. Jalankan aplikasi lokal dengan fixture simulasi dan tes rule engine.
2. Siapkan DNS untuk lumi.<domain> dan ops.lumi.<domain>; bila belum ada, gunakan satu domain dengan route /ops.
3. Deploy Docker Compose: Nginx, app, worker, PostgreSQL.
4. Isi environment secrets melalui VPS, buat migration, dan seed wilayah/preset.
5. Aktifkan HTTPS, jalankan health check, dan lakukan backup dump.
6. Tambahkan adapter live secara bertahap setelah hero demo tetap stabil.

Tidak ada alasan untuk menjalankan model lokal, menyimpan citra satelit mentah, memakai Redis/queue, atau memasang load balancer pada MVP.

## 14. Di luar ruang lingkup MVP

- Prediksi kebakaran, erupsi, atau kualitas udara.
- Perintah evakuasi otomatis atau diagnosis medis.
- Broadcast WhatsApp/SMS/Telegram/push dan integrasi operator.
- Verifikasi OTP, deteksi provider, atau akses data pelanggan.
- Integrasi pemerintah resmi, SSO, dan manajemen pengguna produksi.
- Feed status erupsi serta pemrosesan citra satelit mentah.
- Multi-region deployment, autoscaling, Redis queue, dan load balancer.
- AI agent dengan kemampuan mengambil tindakan sendiri.

## 15. Acceptance criteria backend

1. Input fixture identik selalu menghasilkan tier, rationale, dan action owner hint identik.
2. Empat fixture ruleset-v1 menghasilkan Pantau, Verifikasi, Respons Tinggi Pontianak, dan Data perlu diperbarui sesuai tabel policy.
3. Setiap decision menyimpan evidence source, observed_at, retrieved_at, freshness, dan policy_version.
4. Data stale/gagal tampil sebagai data perlu diperbarui dan tidak otomatis menurunkan tier.
5. Hotspot tunggal menghasilkan bahasa indikator panas dan tidak mengonfirmasi kebakaran.
6. Hanya role Diskominfo dapat approve/reject public notice live; hanya satu pesan PUBLISHED aktif per wilayah.
7. Endpoint publik tidak pernah mengembalikan draft, audit, PII, action brief, atau data SIMULASI, dan selalu memuat currentFreshness.
8. Hasil Simulation Center tidak dapat membuat incident live, public notice, maupun pengiriman eksternal.
9. Perubahan approval bersifat aman terhadap request ganda/konflik dan seluruhnya tercatat di audit log.
10. Jika LLM atau data source gagal, aplikasi tetap menghasilkan output template yang aman dan dapat dibaca.
11. API key dan nomor HP tidak muncul pada browser payload, log, atau repository; consent dapat dicabut dengan kode opaque.
12. PostgreSQL tidak dapat diakses dari internet; app berjalan sehat di belakang HTTPS/reverse proxy.
13. Hero demo Pontianak dapat diulang dari simulasi sampai publikasi yang disetujui tanpa ketergantungan API live.

## 16. Urutan implementasi backend

1. Tipe domain, fixture wilayah, normalizer, dan rule engine beserta test fixture.
2. PostgreSQL migration untuk region, snapshot/decision/incident, action brief, public notice, audit, dan simulation run.
3. Endpoint ops untuk daftar/detail, brief, approval, serta projection publik.
4. Simulation Center end-to-end dengan guard isolasi.
5. Template action brief/public notice; kemudian LLM JSON draft opsional.
6. Opt-in nomor HP dengan masking/consent.
7. Worker data source, Docker Compose, HTTPS, VPS, dan final backup.
