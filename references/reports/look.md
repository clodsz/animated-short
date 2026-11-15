# Look v1: tone dan efek (dikunci)

Sumber kebenaran: `templates/dunia/look.ts` (nilai) dan `templates/dunia/atmos.ts`, `sky.ts`, `Short.tsx` (efek).
Laporan ini menjelaskan isinya, angka targetnya, dan apa yang sudah dicoba lalu gagal.

## 1. Aturan utama: tone dan efek dipisah

| | Isi | Tempat |
|---|---|---|
| **Tone** | Arah dan warna cahaya kunci, warna sisi terang (`lit`), sisi bayangan (`shade`), angkatan bayangan (`lift`), saturasi warna benda (`sat`), gradien langit | `look.ts` `TONE_OF` lewat shading dua-tingkat (`shade.ts`) |
| **Efek** | Kabut jarak, berkas cahaya 3D, glow + genangan lampu, kabut tanah, debu/kunang-kunang, halo matahari, sunburst, halo bulan, blur lensa, bloom, vignette | `look.ts` `EFFECT_OF` + `atmos.ts`, `sky.ts`, `Short.tsx` |
| **Grade warna** | **Netral** di semua waktu. Hanya vignette yang dipakai (sebagai efek). | `grade.ts` |

- Uji tone saja: render dengan semua efek dimatikan, misalnya
  `PROPS='{"fx":{"fog":false,"halo":false,"glow":false,"pool":false,"mist":false,"dust":false,"rays":false,"vig":false},"post":{"lens":false,"bloom":false}}'`.
- Efek yang benar hanya menambah suasana. Kalau warna seluruh frame berubah saat efek dinyalakan, berarti efeknya salah tempat.

## 2. Tone per waktu

| Waktu | Arah cahaya (ke sumber) | Warna kunci | lit | shade | lift | sat | Langit (cakrawala → zenit) |
|---|---|---|---|---|---|---|---|
| Pagi | -0.8, 0.3, -0.5 | #ffd28a | 1.66 1.28 0.84 | .42 .38 .50 | .08 .08 .12 | .72 | #ffe2a8 → #86a4d2 |
| Siang | 0.3, 0.9, 0.35 | #fff3e0 | 1.76 1.68 1.50 | .42 .41 .50 | .07 .08 .13 | .70 | #b8d0ec → #3373cc |
| Sore | 0.85, 0.25, -0.18 | #ffb36b | 1.60 1.08 0.72 | .42 .36 .50 | .07 .07 .12 | .72 | #ffc47c → #8a6f8a |
| Malam | -0.6, 0.75, 0.25 | #bcd0ff | 0.30 0.55 1.80 | .10 .17 .58 | .05 .08 .28 | .25 | #5068c8 → #172672 |

- Siang, pagi, dan sore pastel: saturasi benda 0,70–0,72, bayangan lembut dan terangkat.
- Malam: saturasi benda 0,25 (hampir abu-abu), supaya bulan biru mewarnai semuanya. Warna hangat hanya dari lampu dan jendela.
- Cahaya lampu (PointLight) juga memakai warna benda yang sudah diredam, supaya kayu merah di dekat lampu tidak jadi pink.
- Setiap cahaya punya sumber yang kelihatan. Arah matahari atau bulan tetap per lokasi dan waktu; yang digeser kamera, bukan cahayanya.

## 3. Efek per waktu

| Efek | Pagi | Siang | Sore | Malam |
|---|---|---|---|---|
| Kabut jarak (dekat → jauh, m) | 60 → 520, krem | 160 → 1000 (cakrawala saja) | 90 → 650, jingga | 90 → 600, biru |
| Berkas cahaya 3D | kuat .32 | mati | .30 | tipis .05 |
| Kabut tanah | .50 putih-emas | mati | .15 | mati (malam jernih) |
| Matahari / bulan | matahari 5,5° + sunburst + halo 34° | matahari 2,2° + halo 22° | matahari 5,5° + sunburst + halo 34° | bulan 3,6° + halo biru 14°, bintang |
| Glow + genangan lampu | mati | mati | nyala | nyala |
| Partikel | debu emas | debu halus | debu jingga | kunang-kunang |
| Blur lensa | nyala | mati (siang tajam) | nyala | nyala |
| Vignette | .18 | .18 | .18 | .32 |
| Bloom | lembut lebar: threshold .78, intensitas .45, radius .82, 7 level | sama | sama | sama |

Rincian efek:
- **Glow lampu:** kuning tanpa komponen biru (oranye yang ditambahkan di atas malam biru jadi magenta).
- **Genangan cahaya:** menimpa tanah, bukan ditambahkan; hanya di bawah lampu rendah (≤ 2,5 m), ukuran ≤ 3,5 m.
- **Kabut tanah:** pudar mulai di bawah 18 m dari kamera, supaya tidak jadi balok putih di depan lensa.
- **Berkas cahaya:** geometri 3D searah matahari atau bulan, jadi tertutup oleh atap dan pohon di depannya. Lebarnya nol di bawah 6 m dari kamera.

## 4. Target ukur (still 1080 x 1920)

| | Kecerahan median | Saturasi median | Lain-lain |
|---|---|---|---|
| Siang | ~.55–.65 | ~.35–.40 | bayangan tidak pekat (p5 ≥ ~.25) |
| Malam | ~.26–.35 | — | biru ≥ 75 % frame, hijau 0 %, hangat hanya di lampu/jendela |

Cara ukur: luma Rec.709 per piksel, saturasi HSV; biru = hue 200–270° dengan saturasi > .15.

## 5. Sudah dicoba dan gagal (jangan diulang)

- **Tone lewat grade** (angkat bayangan, tint): seluruh frame tertutup lapisan "susu".
- **God rays postprocessing (`GodRaysEffect`):** cuma cincin di sekitar matahari, dan matahari jadi pink. Diganti berkas cahaya 3D.
- **Kabut jarak terlalu dekat:** frame pucat, gunung jadi segitiga rata.
- **Kabut tanah dekat kamera:** jadi balok putih.
- **Glow oranye additive di malam biru:** jadi magenta.
- **Kabut tanah di malam hari:** frame jadi abu-abu kebiruan, tidak jernih.
