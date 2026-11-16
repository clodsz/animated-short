# Depth: kabut, atmosfer, latar jauh, blur lensa, bloom, kamera

Kode: `templates/dunia/lights.ts` (`TONE_OF.fog*`, `EFFECT_OF`), `world.ts` (`Atmos`, `Sky`), `Dunia.tsx`,
`lensblur.ts`, `story.ts` (`DOF`, `SHIFT`).

## 1. Kabut jarak (efek)
Kabut linier dengan warna = warna cakrawala, jadi benda jauh melebur ke langit. Hanya lapisan jauh yang pudar; dekat
dan tengah tetap tajam.

| Waktu | Dekat → jauh (m) | Warna |
|---|---|---|
| Pagi | 60 → 520 | #f6dcb4 krem |
| Siang | 160 → 1000 (cakrawala saja) | #c4d8ee |
| Sore | 90 → 650 | #efb894 jingga |
| Malam | 90 → 600 | #3a50b0 biru |

## 2. Atmosfer (efek, `Atmos`)
- **Berkas cahaya:** 90 pita lembut 3D sepanjang 18–40 m, lebar 0,8–3,4 m, searah matahari/bulan, menghadap kamera di
  sumbunya. Karena geometri sungguhan, atap dan pohon di depannya menutupinya. Lebar nol di bawah 6 m dari kamera,
  penuh di 14 m.
- **Kabut tanah:** 70 pita tipis setinggi 0,35–1,25 m di footprint set, bergeser pelan, pudar di bawah 18 m dari kamera
  (penuh di 40 m) supaya tidak jadi balok putih di depan lensa.
- **Partikel:** 260 titik di kotak 30 x 3,8 x 30 m yang mengikuti kamera, masing-masing melayang sendiri.
- Kekuatan per waktu: `lighting.md` §5.

## 3. Langit (`Sky`)
- Kubah gradien 5 warna (0 / 4 / 10 / 20 / 40° elevasi), warna cakrawala = warna kabut.
- Awan lukis tiga warna (terang, tengah, bawah lavender) dengan dasar datar, di siang/pagi/sore; tidak di malam.
- Matahari, sunburst, bulan, halo, dan bintang mengikuti kamera di jarak 800 m.

## 4. Latar jauh
- Benda jauh tetap geometri 3D sederhana yang ikut perspektif.
- Lapisan paling jauh (gunung, siluet kota) boleh lukisan datar berlapis yang memudar dalam kabut.
- Pemandangan di balik pintu atau gerbang dibangun 3D sungguhan, bukan gambar tempel.

## 5. Blur lensa (efek)
- Lensa tipis: lingkar kabur = `cInf × |1 − fokus / jarak|` px di 1080, sisi depan × 1,2, maksimum 24 px
  (`lensblur.ts`).
- Siang tajam (blur mati). Pagi, sore, dan malam: nyala di shot jalanan, ringan (`cInf` 6 x 0,2), aerial selalu tajam.
- Fokus = titik `DOF[shot].focus`, kalau tidak ada = titik bidik kamera.

## 6. Bloom (efek)
Tipis, hanya di sumber cahaya: threshold .92, smoothing .2, intensitas .14, 6 level, radius .7, blend ADD (2026-11-16; v1 .78 / .3 / .45 / 7 / .82 terlalu berkabut). Rantai MIP selalu
berbasis tinggi 1920 sehingga glow ikut skala frame.

## 7. Kamera
- Kamera tegak: garis vertikal tetap tegak. Untuk membingkai bangunan tinggi, geser bingkai dengan shift lens
  (`SHIFT[shot]` = pergeseran NDC, misalnya 0,28–0,30), jangan didongakkan.
- Setiap shot selalu bergerak: dorongan pelan ~0,2 %/frame ke titik bidik selama hold.

## 8. Sudah dicoba dan gagal (jangan diulang)
- God rays postprocessing (`GodRaysEffect`): cuma cincin di sekitar matahari, dan matahari jadi pink.
- Kabut jarak terlalu dekat: frame pucat, gunung jadi segitiga rata.
- Kabut tanah dekat kamera: jadi balok putih.
- Kamera didongakkan ke bangunan tinggi: menara miring, tidak seperti ilustrasi.
