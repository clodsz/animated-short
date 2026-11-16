# Style bible

Tiga formula yang sudah ditetapkan untuk dunia 3D. Rinciannya ada di `reports/`.

## Tone (`reports/lighting.md`)
- Empat waktu: pagi emas, siang pastel bersih, sore jingga-ungu, malam biru jernih.
- Tone hanya di cahaya dan warna permukaan (`lights.ts` `TONE_OF`); grade warna netral.
- Warna hidup (vivid): saturasi warna dasar 1,0 siang, lapisan abu-biru bayangan setengah, jadi bayangan tetap berwarna;
  malam saturasi .55 supaya biru bulan menang, hangat hanya di lampu.
- Setiap cahaya punya sumber yang kelihatan; arah matahari/bulan tetap per lokasi dan waktu.

## Efek (`reports/lighting.md` §5, `reports/depth.md`, `reports/grade.md`)
- Terpisah dari tone dan bisa dimatikan satu per satu (`FX`).
- Pagi: berkas cahaya kuat, kabut tanah emas, debu. Siang: bersih dan tajam, tanpa blur. Sore: matahari besar,
  sunburst, berkas cahaya, glow lampu. Malam: jernih, bulan besar berhalo, glow kuning + genangan lampu, kunang-kunang.
- Tajam: bloom tipis hanya di sumber cahaya, blur lensa ringan (x0,2); vignette .18 (.32 malam).

## Gaya dunia (`reports/textures.md`, `reports/outlines.md`)
- Bentuk sederhana dan tebal, bagian penting timbul 5–20 cm, proporsi sedikit dilebihkan.
- Detail digambar di tekstur Canvas: bidang warna datar, unsur satu per satu, garis sambungan berwarna lokal yang
  digelapkan (bukan hitam).
- Tinta cokelat sangat gelap hanya di siluet, lompatan kedalaman, dan lipatan tajam (~3 px dekat, memudar jauh).
- Pohon dan semak gumpalan bulat; rumput dan bunga kartu bergaris.
- Set padat properti dari komponen yang bisa dipakai ulang; latar jauh tetap 3D; kamera tegak dengan shift lens.

## Frame acuan
- `frames/`: still `LookTest` (render repo ini, bentuk polos) di setiap waktu, untuk mencocokkan tone dan efek:
  `pagi.jpg`, `siang.jpg`, `sore.jpg`, `malam.jpg`, `sore_matahari.jpg`.
- `sheets/looktest.jpg`: kelima still dalam satu lembar.
