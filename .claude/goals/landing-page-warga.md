# Goal: Landing Page Warga — LUMI

> Disimpan sebagai `.claude/goals/landing-page-warga.md`. PM men-delegasikan ke `developer`, lalu `qa-visual` dan `qa-functional` mengecek sebelum status jadi `done`.
> Versi ini menggantikan total draft sebelumnya — struktur alur, tema, dan form berubah signifikan hasil diskusi lanjutan.

## Tujuan
Landing page publik untuk warga yang menyampaikan cerita "kenapa LUMI dibutuhkan" secara storytelling linear (bukan flowchart abstrak) sebelum mengarahkan warga daftar, dengan identitas visual yang beda dari LUMI Ops — tetap mudah dipahami semua kalangan termasuk lansia.

## Struktur Alur Halaman (urutan dari atas ke bawah)

1. **Loading animation** — singkat (~2 detik), bisa di-skip, ringan
2. **Section Intro**
   - Peta live (data real, scope saat ini Kalimantan, arsitektur siap nasional) + statistik "jumlah titik terpantau" ditampilkan di sini sebagai bukti visual
   - Teks singkat: masalah-masalah sebelum ada LUMI (kebakaran lahan, kabut asap, minim informasi jelas ke warga, dll)
   - Cue visual "scroll ke bawah" di akhir section
3. **Section Cara Kerja**
   - Diagram alur visual berbentuk garis zigzag/snake yang menyambungkan tiap langkah secara vertikal (sesuai sketsa tangan user — bukan garis lurus horizontal)
   - Diagram terungkap bertahap saat discroll, user yang kontrol kecepatan (bukan auto-play timed)
   - Dipadu dengan card 5-langkah yang sudah ada: Sensor mendeteksi → DLH memverifikasi → BPBD menindaklanjuti → Notice terbit → Warga menerima info
4. **Section "Yang terselesaikan oleh LUMI"**
   - Manfaat/hasil konkret yang warga dapatkan dari sistem ini — bukan fitur teknis, tapi outcome yang warga rasakan
5. **Section penutup**
   - CTA "Daftar sekarang"
   - Footer standar profesional (kontak, alamat instansi, link resmi, dll)

## Kriteria Selesai (Definition of Done)

**Loading & Intro**
- [ ] Loading animation berjalan nyata saat page pertama dibuka (bukan cuma ada di kode) — WAJIB bukti rekaman/screenshot
- [ ] Peta live + statistik jumlah titik tampil di section Intro, bukan di hero terpisah
- [ ] Teks masalah "sebelum ada LUMI" singkat, jelas, bahasa awam
- [ ] Ada cue visual scroll di akhir section Intro

**Cara Kerja (Storytelling)**
- [ ] Diagram zigzag/snake vertikal menyambungkan 5 step, sesuai referensi sketsa
- [ ] Diagram muncul bertahap mengikuti scroll, user kontrol kecepatan
- [ ] Card 5-langkah existing tetap dipakai, terintegrasi dengan diagram
- [ ] Satu ide per step, ikon besar + teks pendek, bahasa campuran (semi-formal tapi mudah dimengerti)

**Yang terselesaikan oleh LUMI**
- [ ] Section baru berisi manfaat/outcome konkret (bukan device fitur teknis) yang warga rasakan

**Navigasi & Routing**
- [ ] Navbar HANYA berisi "Masuk" (teks/link biasa) dan "Daftar" (button, posisi paling kanan) — tidak ada link "Cara kerja" atau "Laporkan kondisi" lagi
- [ ] Klik "Masuk" navigasi ke route `/masuk` (halaman terpisah, bukan modal)
- [ ] Klik "Daftar" navigasi ke route `/daftar` (halaman terpisah, bukan modal)
- [ ] Fitur "Laporkan kondisi" DIHAPUS dari landing publik — dipindah jadi fitur di dashboard warga (setelah login)

**Form Daftar**
- [ ] 4 field, SEMUA WAJIB dan setara (tidak ada yang lebih utama): email, kata sandi (min. 8 karakter), gender, nama panggilan — login = email + kata sandi (keputusan user, menggantikan nomor HP)
- [ ] TANPA verifikasi OTP, TANPA opsi login Google

**Setelah Login (Dashboard Warga)**
- [ ] User diarahkan ke halaman/dashboard terpisah setelah login — berisi: mantau peta live, lihat info dari ops, dan fitur "Laporkan kondisi" (pindahan dari landing)
- [ ] Landing page TIDAK BISA diakses lagi setelah login — auto-redirect ke dashboard kalau user yang sudah login coba akses landing
- [ ] Sesi login persistent 30-90 hari (refresh token) — tidak perlu re-login tiap buka web
- [ ] Catatan: dashboard warga ini scope-nya BEDA goal file — cukup pastikan redirect & routing-nya benar di goal ini, detail isi dashboard dikerjakan terpisah

**Tema Visual**
- [ ] Dark theme: base true-black (bukan navy gradasi seperti sekarang)
- [ ] Light theme: base putih/abu sangat terang dengan tint biru halus (bukan putih polos flat)
- [ ] Biru dipertahankan sebagai aksen, 1 shade konsisten di kedua tema, muted/kalem (bukan biru cerah generic yang sama kayak tema Ops)
- [ ] Parity struktur & spacing IDENTIK antara dark dan light — cuma base color & shade yang beda
- [ ] Visual harus terasa BEDA dari tema LUMI Ops (navy/cyan) — true-black/true-white based, bukan navy gradasi

**Font & Anti-AI-Slop**
- [ ] Body text tetap Inter/Geist
- [ ] Headline pakai font display lebih berkarakter (Space Grotesk atau sejenis) — dipilih setelah lihat referensi
- [ ] Hapus background dekoratif generic (grid/dot pattern) yang tidak fungsional
- [ ] Hierarki font-weight bervariasi — jangan semua elemen sama-sama bold

**Peta & Performa**
- [ ] Clustering aktif (`Leaflet.markercluster` atau setara) — wajib karena arsitektur disiapkan skala nasional
- [ ] Layout & viewport peta disiapkan untuk skala nasional meski data live baru Kalimantan

**Layout & Responsif**
- [ ] Layout desktop mengisi lebar viewport secara proporsional — TIDAK BOLEH ada ruang kosong besar di kiri-kanan pada resolusi umum (1440px, 1920px)
- [ ] Fully responsive mobile & desktop
- [ ] WAJIB dites di simulasi HP Android kelas menengah-bawah — animasi & diagram scroll harus tetap smooth
- [ ] Optimasi untuk koneksi bervariasi (lazy load, compress asset)

**Aksesibilitas**
- [ ] Kontras cukup, font scalable, touch target besar — nyaman untuk lansia maupun pengguna muda

**Di luar scope ini (sengaja ditunda)**
- [ ] SSE/real-time map — arsitektur tidak menutup kemungkinan ditambahkan nanti
- [ ] Keamanan (rate limiting, verifikasi email asli, dll)
- [ ] Isi detail dashboard warga (goal file terpisah)

## Verifikasi sebelum status "done"
- [ ] `qa-visual` WAJIB kirim screenshot/rekaman bukti untuk: loading animation, intro dengan peta+statistik, diagram storytelling saat discroll, layout desktop (2 resolusi), layout mobile, dark & light mode
- [ ] Kalau ada kriteria yang tidak ada buktinya, status TIDAK boleh naik ke `done` — kembalikan ke developer dengan poin spesifik yang gagal

## Dikerjakan oleh
`developer` (implementasi) → `qa-visual` (tema, kontras, storytelling, layout, bukti visual) → `qa-functional` (clustering performance, routing /masuk /daftar, redirect setelah login, form validasi)

## Dependency
- Skema Supabase & data titik Kalimantan yang sudah ada
- Keputusan dashboard warga (goal file terpisah, belum dibuat) — routing redirect di goal ini harus konsisten begitu dashboard-nya jadi

## Referensi
- Map/clustering: Windy.com, NASA FIRMS
- Storytelling diagram: "How Search Works" (Google), Apple product pages (scroll control), Stripe (statistik hidup)
- Font & tema: Linear.app (parity dark/light), Vercel (biru sebagai aksen bukan dominan), Attio (biru muted), Space Grotesk (font display)
- Bahasa & hierarki: GOV.UK

## Status
done — restructure selesai & terverifikasi browser (intro tanpa peta, peta full-bleed, cara kerja centered flow dengan scroll-reveal terbukti via rekaman, 1920/1440/mobile aman, dark/light paritas, tsc lolos)
