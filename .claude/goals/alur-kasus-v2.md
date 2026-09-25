# Goal: Alur Kasus v2 + Sidebar + Peta + Warga (Spesifikasi Lengkap)

> Simpan sebagai `.claude/goals/alur-kasus-v2.md`. Spesifikasi dari user, 24 Sep 2026.
> **Status tahap 1 (Ops): done** — A–E, G, I selesai & terverifikasi UI. **Tersisa: F (hotspot) + H (warga layout).**

## A. Alur kasus baru (state machine v2)

1. **Kasus terdeteksi** — sama seperti sekarang (Simulator kirim → masuk board).
2. **BPBD verifikasi** — BPBD yang verifikasi duluan (bukan DLH).
3. **DLH terima & pantau** — DLH mantau AQI; lalu bekerja sama dengan Diskominfo menyebar informasi ke web warga / notifikasi provider (tahap baru, tanpa halaman kominfo).
4. **Tindak lanjut & eskalasi** — dua jalur PARALEL, tidak saling gantung:
   - BPBD: selesai sendiri ATAU minta bantuan BNPB (eskalasi kapasitas lapangan).
   - DLH: opsional, independen — lapor KLH untuk broadcast nasional (bukan minta izin).
5. **Penutupan**:
   - KLH menerima (approve) bantuan & bekerja sama dengan Kominfo (tanpa halaman kominfo).
   - BNPB selesai membantu → menyerahkan kembali ke BPBD.
   - KLH selesai membantu → ada tombol untuk menyatakan bantuan selesai.
   - Penyelesai AKHIR kasus: DLH (dari sisi daerah). Kasus benar-benar selesai hanya ketika DLH klik "selesai" — BPBD bisa selesai duluan sedangkan DLH masih pantau.
   - BNPB dan KLH saling tidak terikat; semua pihak saling bisa memantau.

## B. Timeline kasus ala gambar (R.A. Kartini Instagram timeline)

- Horizontal dari kiri: tiap step = **tanggal + jam** (dari event) di atas garis, **status** di bawahnya ("Kasus masuk", "BPBD verifikasi", dst).
- Kalau lebar penuh ke kanan → wrap ke baris kedua di bawah (seperti zigzag gambar).
- Letak teks rapi; kasus berbentuk accordion, **semua tertutup secara default** (tidak ada auto-open).

## C. Sidebar Ops

- Urutan: 1) **Peta ISPU Nasional** (icon peta milik Peta Situasi), 2) **Verifikasi & Tindakan** (rename dari "Kasus & Eskalasi"; isi halaman lama "Verifikasi & Tindakan" dihapus), 3) item lain per peran.
- **Hapus**: "Peta Situasi", "Status Respons".

## D. Peta ISPU Nasional

- Clustering hanya saat ≥15 titik; di bawah itu titik tampil terpisah.
- Semua dropdown diberi label di atas: Provinsi (kosong = "Seluruh Indonesia"), Sortir, Tampilan titik (Gabungan/Setiap Titik), Kepadatan titik.
- Hapus: garis batas provinsi, button "lihat seluruh Indonesia", caption "Angka ISPU tercetak pada tiap titik; 1.000–10.000 titik simulasi dengan clustering, filter provinsi, dan sortir."
- Warna titik diberi border/outline agar terlihat jelas di dark theme.

## E. Log & Audit

- Perbaiki tampilan agar lebih jelas, gaya developer (mono, padat, mudah scan).
- Filter: hanya menampilkan jejak akun yang sedang login.

## F. Hotspot (BPBD & BNPB)

- Titik hotspot dengan tingkat kepercayaan: Hijau 0–29%, Kuning 30–79%, Merah 80–100%.
- Beda dari ISPU; sortir & filter provinsi/jumlah titik sama dengan peta ISPU.

## G. Akun provinsi (Kalimantan 5 provinsi)

- operator.dlh@demo.lumi.id dan koordinator.bpbd@demo.lumi.id dibuat per-provinsi untuk seluruh provinsi Kalimantan; label mis. "Koordinator BPBD Kalimantan Barat" — tampilan rapi.

## H. Warga

- Peta ISPU + hotspot bisa dilihat tanpa login (drawer garis-tiga di dalam map).
- Setelah login: layout ala udara.jakarta.go.id dengan sidebar desktop; mobile navbar 3 item: Home (map+pantau), Laporkan (deskripsi, foto dari kamera/galeri, lokasi via pencarian Google Maps), Profile (biodata, pfp, keluar).
- Akun uji: amelia.warga@demo.lumi.id.

## I. Bug

- Halaman Peta ISPU Nasional: map keluar menabrak/tertutup sidebar. Fixed.
