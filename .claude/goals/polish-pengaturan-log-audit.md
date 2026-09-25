# Goal: Polish Halaman Pengaturan & Log-Audit (LUMI Ops)

> Simpan sebagai `.claude/goals/polish-pengaturan-log-audit.md`

## Tujuan
Redesign halaman Pengaturan dan Log & Audit di LUMI Ops supaya lebih profesional dan jelas — pola settings ala Linear/GitHub (grouping rapi, live preview), dan log ala Stripe Events (timeline, bukan tabel polos).

## Kriteria Selesai (Definition of Done)

**Halaman Pengaturan**
- [ ] Hapus opsi "Kepadatan dashboard" sepenuhnya (termasuk field dan logikanya)
- [ ] "Ukuran teks": tambahkan live preview kecil di dekat dropdown — contoh teks yang BENERAN berubah ukuran real-time saat opsi diganti, bukan cuma keterangan angka di teks
- [ ] Opsi "Besar" pada ukuran teks harus benar-benar menerapkan scale ~1.75x dari ukuran normal (bukan cuma sedikit lebih besar)
- [ ] Styling ikuti pola grouping rapi per kategori (ala Linear) — tiap opsi tetap punya deskripsi singkat di bawah labelnya
- [ ] Konten/copy section "Akun" dan struktur informasi lain yang sudah ada DIPERTAHANKAN — user sudah bilang isinya oke, jangan diubah tanpa alasan

**Halaman Log & Audit**
- [ ] Ganti tampilan tabel polos jadi **timeline ala Stripe Events** — tiap entri log jadi item timeline yang bisa di-expand untuk lihat detail lengkap
- [ ] Tambahkan color-coded severity tag di kiri tiap entri timeline:
  - Merah: menunggu respons lama
  - Kuning/oranye: menunggu tapi belum lama
  - Hijau: sudah direspons/selesai
- [ ] Section "Akuntabilitas — Menunggu respons" dan "Notifikasi Peran BPBD" tetap ada kontennya, disusun ulang mengikuti gaya timeline
- [ ] Log tetap PERMANEN dan tidak bisa dihapus — requirement lama ini tidak berubah

## Dikerjakan oleh
`developer` (implementasi) → `qa-visual` (cek preview ukuran teks beneran jalan real-time, styling timeline & severity tag, grouping settings)

## Verifikasi sebelum status "done"
- [ ] Rekaman/screenshot: ukuran teks berubah live saat dropdown "Ukuran teks" diganti ke "Besar" (bandingkan sebelum-sesudah, harus kelihatan bedanya ~1.75x)
- [ ] Screenshot halaman Log & Audit dalam bentuk timeline dengan severity tag berwarna
- [ ] Konfirmasi "Kepadatan dashboard" sudah tidak ada lagi di halaman

## Status
done — kepadatan dihapus, live preview 16→28px (1.75x) terverifikasi real-time, grouping ala Linear; Log & Audit jadi timeline expandable dengan severity merah/kuning/hijau, permanen tetap terjaga
