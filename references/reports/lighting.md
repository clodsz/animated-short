# Lighting: tone dan efek per waktu (dikunci)

Kode: `templates/dunia/lights.ts` (`TONE_OF`, `EFFECT_OF`, `FX`), shading di `shade.ts`.

## 1. Aturan utama: tone dan efek dipisah

| | Isi | Tempat |
|---|---|---|
| **Tone** | Arah dan warna cahaya kunci, warna sisi terang (`lit`), sisi bayangan (`shade`), angkatan bayangan (`lift`), saturasi warna benda (`sat`), gradien langit | `TONE_OF` lewat shading dua-tingkat |
| **Efek** | Kabut jarak, berkas cahaya 3D, glow + genangan lampu, kabut tanah, debu/kunang-kunang, halo matahari, sunburst, halo bulan, blur lensa, bloom, vignette | `EFFECT_OF` + `world.ts` (`Sky`, `Atmos`) + `Dunia.tsx` |
| **Grade warna** | Netral (lihat `grade.md`) | `grade.ts` |

- Uji tone saja: render dengan semua efek dimatikan,
  `PROPS='{"fx":{"fog":false,"halo":false,"glow":false,"pool":false,"mist":false,"dust":false,"rays":false,"vig":false},"post":{"lens":false,"bloom":false}}'`.
- Efek yang benar hanya menambah suasana. Kalau warna seluruh frame berubah saat efek dinyalakan, efeknya salah tempat.

## 2. Model shading
`albedo × mix(shade, lit, terkena matahari) + lift × (1 − terkena matahari)`, dengan `terkena matahari` = shadow map ×
terminator lembut N·L. Saturasi albedo diputar di sekitar luma dengan `sat`. Tidak ada AO.

## 3. Tone per waktu

Nilai vivid (2026-11-16, pilihan pemilik): saturasi 1,0 siang / .55 malam, lift bayangan setengah dari v1 (v1: sat .70–.72 / .25).

| Waktu | Arah cahaya (ke sumber) | Warna kunci | lit | shade | lift | sat | Langit (cakrawala → zenit) |
|---|---|---|---|---|---|---|---|
| Pagi | -0.8, 0.3, -0.5 | #ffd28a | 1.66 1.28 0.84 | .42 .38 .50 | .04 .04 .06 | 1.0 | #ffe2a8 → #86a4d2 |
| Siang | 0.3, 0.9, 0.35 | #fff3e0 | 1.76 1.68 1.50 | .42 .41 .50 | .035 .04 .065 | 1.0 | #b8d0ec → #3373cc |
| Sore | 0.85, 0.25, -0.18 | #ffb36b | 1.60 1.08 0.72 | .42 .36 .50 | .035 .035 .06 | 1.0 | #ffc47c → #8a6f8a |
| Malam | -0.6, 0.75, 0.25 | #bcd0ff | 0.30 0.55 1.80 | .10 .17 .58 | .025 .04 .14 | .55 | #5068c8 → #172672 |

- Siang, pagi, dan sore pastel: saturasi benda 0,70–0,72, bayangan lembut dan terangkat.
- Malam: saturasi benda 0,25 (hampir abu-abu), supaya bulan biru mewarnai semuanya. Hangat hanya dari lampu dan jendela.
- Palet benda hangat dan diredam: warna netral atau abu-abu jadi lavender di bayangan biru-ungu.

## 4. Lampu (sumber cahaya praktis)
- Setiap cahaya punya sumber yang kelihatan: lampu = `PointLight` di posisi bendanya, plus benda emisif kecil.
- Arah matahari atau bulan tetap per lokasi dan waktu; yang digeser kamera, bukan cahayanya.
- Cahaya lampu memakai albedo yang sudah diredam (`shade.ts`), supaya kayu merah di dekat lampu tidak jadi pink.
- Lampu menyala di sore dan malam (`EFFECT_OF.lampsOn`).
- **Glow lampu:** kuning tanpa komponen biru. Oranye yang ditambahkan di atas malam biru jadi magenta.
- **Genangan cahaya:** menimpa tanah (bukan ditambahkan), hanya di bawah lampu rendah (≤ 2,5 m), ukuran ≤ 3,5 m.
- Glow dan genangan dibuat otomatis dari `PointLight` di set (`new Atmos(set.root, set.area)`).

## 5. Efek per waktu

| Efek | Pagi | Siang | Sore | Malam |
|---|---|---|---|---|
| Berkas cahaya 3D | kuat .32 | mati | .30 | tipis .05 |
| Kabut tanah | .50 putih-emas | mati | .15 | mati (malam jernih) |
| Matahari / bulan | matahari 5,5° + sunburst + halo 34° | matahari 2,2° + halo 22° | matahari 5,5° + sunburst + halo 34° | bulan 3,6° + halo biru 14°, bintang |
| Glow + genangan lampu | mati | mati | nyala | nyala |
| Partikel | debu emas | debu halus | debu jingga | kunang-kunang |

Kabut jarak, blur lensa, dan bloom: `depth.md`. Vignette: `grade.md`.

## 6. Target ukur (still 1080 x 1920)

| | Kecerahan median | Saturasi median | Lain-lain |
|---|---|---|---|
| Siang | ~.55–.65 | ~.35–.40 | bayangan tidak pekat (p5 ≥ ~.25) |
| Malam | ~.26–.35 | — | biru ≥ 75 % frame, hijau 0 %, hangat hanya di lampu/jendela |

Cara ukur: luma Rec.709 per piksel, saturasi HSV; biru = hue 200–270° dengan saturasi > .15.

## 7. Sudah dicoba dan gagal (jangan diulang)
- Glow oranye additive di malam biru: jadi magenta.
- Kabut tanah di malam hari: frame jadi abu-abu kebiruan, tidak jernih.
- Saturasi benda normal di malam hari: dinding merah dan rumput hijau tetap menyala, malam tidak terbaca biru.
