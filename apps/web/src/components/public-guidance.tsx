const steps = [
  ["Kurangi kegiatan di luar", "Tunda olahraga dan aktivitas berat di luar rumah sampai ada pembaruan berikutnya."],
  ["Gunakan masker bila perlu keluar", "Pilih masker yang menutup hidung dan mulut dengan baik saat harus bepergian."],
  ["Utamakan kelompok rentan", "Anak-anak, lansia, ibu hamil, serta warga dengan gangguan jantung atau paru sebaiknya lebih banyak beraktivitas di dalam ruangan."]
];

export function PublicGuidance() {
  return <section className="section" aria-labelledby="tindakan-aman"><h2 id="tindakan-aman">Tindakan aman hari ini</h2><div className="step-list">{steps.map(([title, text], index) => <article className="step" key={title}><span className="step-number">{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>;
}
