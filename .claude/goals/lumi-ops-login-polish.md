# Goal: LUMI Ops — Polish Halaman Login (Petugas)

> Disimpan sebagai `.claude/goals/lumi-ops-login-polish.md`. Scope kecil, langsung bisa dikerjakan `developer` tanpa banyak dependency.

## Tujuan
Memperbaiki halaman login petugas (LUMI Ops) supaya copy-nya konsisten & terdengar manusiawi, istilah role sinkron dengan seluruh sistem, dan elemen visual generic/AI-slop dihilangkan — tanpa mengubah pola layout split hero+login-card yang sudah tepat untuk tool internal staff.

## Kriteria Selesai (Definition of Done)

**1. Perbaiki kalimat deskripsi hero**
- Teks sekarang: *"Skenario dibangun di ruang uji, DLH memvalidasi lingkungan, BPBD mengelola respons, lalu Approver menerbitkan informasi warga."*
- Masalah: klausa pertama pasif ("dibangun"), tiga klausa berikutnya aktif ("memvalidasi", "mengelola", "menerbitkan") — struktur nggak konsisten, kedengaran seperti potongan kalimat yang digabung tanpa dihaluskan.
- Ganti dengan salah satu (tergantung keputusan poin 2 di bawah):
  - Kalau istilah resminya **"Simulator"**: *"Tim menyusun skenario di Simulator, DLH memvalidasi kondisi lingkungan, BPBD mengelola respons di lapangan, dan Approver menerbitkan informasi resmi untuk warga."*
  - Kalau istilah resminya tetap **"Ruang Uji"**: *"Tim menyusun skenario di Ruang Uji, DLH memvalidasi kondisi lingkungan, BPBD mengelola respons di lapangan, dan Approver menerbitkan informasi resmi untuk warga."*
- [ ] Kalimat baru dipakai, semua klausa konsisten aktif

**2. WAJIB DIPUTUSKAN DULU sebelum poin 1 & label "Alur Lintas Instansi" dikerjakan**
- [ ] Konfirmasi ke user: apakah "Ruang uji" di halaman ini adalah rename sengaja dari role **Simulator** (yang dipakai di Simulation Center / true-black-amber theme), atau ini istilah placeholder yang nggak sengaja beda?
- Kalau rename sengaja → pakai "Ruang Uji" konsisten di SEMUA tempat termasuk dokumentasi & agent lain, jangan campur dengan "Simulator"
- Kalau tidak sengaja → ganti jadi "Simulator" di halaman ini biar sinkron dengan sisa sistem
- [ ] Label "Alur Lintas Instansi: Ruang uji / DLH / BPBD / Approver" disesuaikan hasil keputusan ini

**3. Tambahkan elemen yang hilang**
- [ ] Tambah link "Lupa kata sandi?" di bawah/dekat field "Kata Sandi", sebelum tombol Masuk — elemen standar yang bikin form kerasa lengkap, bukan mockup setengah jadi

**4. Hilangkan AI-slop visual**
- [ ] Hapus atau ganti pola grid/dot samar di panel kiri (background decorative) — ini pola generic yang sering muncul otomatis tanpa alasan fungsional. Kalau mau tetap ada elemen dekoratif, ganti dengan sesuatu yang related ke data (misal pola titik pantau/peta yang samar), bukan grid generic
- [ ] Perbaiki hierarki font-weight: saat ini headline, label kecil ("KOORDINASI LINGKUNGAN"), dan beberapa elemen lain sama-sama bold/berat — bikin semua kerasa "berteriak" dan generic ala-AI. Pertahankan bold HANYA di headline utama ("Satu ruang kerja..."), turunkan weight elemen label/kategori ke medium/regular untuk kontras hierarki yang lebih natural

**5. Pastikan parity dark/light tetap terjaga**
- [ ] Setelah semua perubahan di atas, cek ulang kedua tema (dark & light) — pastikan nggak ada elemen yang keteteran/hilang di salah satu mode akibat perubahan ini

## Dikerjakan oleh
`developer` (implementasi) → `qa-visual` (cek copy baru, konsistensi istilah, hierarki font, parity dark/light)

## Dependency
- Keputusan terminologi "Ruang Uji" vs "Simulator" (poin 2) — HARUS clear dulu sebelum poin 1 & label alur dikerjakan, supaya nggak bolak-balik revisi

## Catatan
- Pola layout split hero+login-card TIDAK PERLU diubah — untuk tool internal staff, pola familiar ini justru bagus buat trust & kecepatan pakai. Fokus polish di copy, konsistensi istilah, dan elemen dekoratif generic saja

## Konteks dari developer
- "Ruang uji" di halaman login muncul dari permintaan user sebelumnya ("kata simulator di login itu dihapus saja") — jadi di halaman login itu penggantian sengaja, tapi **hanya di halaman login**. Sisa sistem masih memakai "Simulator": nav "Simulation Center", shell "LUMI Simulator", label peran "Operator Simulator", riwayat event "Simulator membuat skenario…". Keputusan poin 2 menentukan arah unifikasi.

## Status
in-progress — poin 3/4/5 dikerjakan developer; poin 1 & label alur menunggu keputusan poin 2 dari user
