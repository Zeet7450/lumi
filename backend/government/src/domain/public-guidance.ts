import type { PriorityTier } from "@lumi/contracts";

export interface PublicGuidance {
  tier: PriorityTier;
  title: string;
  actions: string[];
  vulnerableGroupGuidance: string[];
}

/**
 * Human-reviewed baseline copy for the public API. It is deliberately
 * deterministic: the rule engine decides the tier, while this module gives
 * the future web app concise, non-diagnostic guidance for that tier.
 */
export const publicGuidance: Record<PriorityTier, PublicGuidance> = {
  MONITOR: {
    tier: "MONITOR",
    title: "Pantau pembaruan kualitas udara.",
    actions: [
      "Periksa pembaruan resmi sebelum merencanakan aktivitas luar ruang yang lama.",
      "Kurangi sumber asap di sekitar rumah dan lingkungan bila memungkinkan."
    ],
    vulnerableGroupGuidance: [
      "Anak-anak, lansia, ibu hamil, dan warga dengan penyakit jantung atau paru dapat mengikuti saran tenaga kesehatan mereka bila merasa perlu."
    ]
  },
  VERIFY: {
    tier: "VERIFY",
    title: "Kondisi sedang diverifikasi oleh petugas.",
    actions: [
      "Pertimbangkan membatasi aktivitas luar ruang yang tidak mendesak.",
      "Pantau pembaruan resmi daerah karena data dan kondisi dapat berubah."
    ],
    vulnerableGroupGuidance: [
      "Kelompok rentan sebaiknya mengurangi paparan di luar ruang bila memungkinkan dan mengikuti anjuran tenaga kesehatan mereka."
    ]
  },
  HIGH_RESPONSE: {
    tier: "HIGH_RESPONSE",
    title: "Kualitas udara memerlukan perhatian lebih tinggi.",
    actions: [
      "Batasi aktivitas luar ruang yang tidak mendesak dan ikuti pengumuman resmi pemerintah daerah.",
      "Kurangi masuknya udara luar ke ruang dalam bila kondisi bangunan memungkinkan."
    ],
    vulnerableGroupGuidance: [
      "Anak-anak, lansia, ibu hamil, serta warga dengan penyakit jantung atau paru sebaiknya meminimalkan paparan dan mengikuti anjuran tenaga kesehatan mereka."
    ]
  }
};
