---
name: animated-short
description: Locked look (tone + effects for morning / noon / dusk / night) and the world-style formula for vertical 3D cartoon-world shorts rendered with three.js inside Remotion. Use when building or checking a 3D world set for these shorts, when changing light or atmosphere, or when the user says "pakai look dunia" / "use the animated-short look".
---

# Animated short: look dan gaya dunia (three.js + Remotion)

Isi skill ini hanya yang sudah ditetapkan:
1. **Tone** empat waktu (pagi, siang, sore, malam).
2. **Efek** empat waktu (kabut, berkas cahaya, glow lampu, kabut tanah, partikel, matahari/bulan, blur lensa, bloom, vignette).
3. **Formula gaya dunia** (aturan bentuk, tekstur, garis, vegetasi, kepadatan, kedalaman, kamera).

Karakter, kamera per adegan, naskah, suara, dan audio belum termasuk.

## Isi
| Path | Isi |
|---|---|
| `templates/dunia/` | Kode look: `look.ts` (nilai tone + efek), `shade.ts` (shading dua-tingkat), `sky.ts`, `atmos.ts`, `ink.ts`, `lensblur.ts`, `grade.ts` (netral), `world.ts`, `Short.tsx` (komposisi `LookTest`), `testset.ts` (bentuk polos untuk uji) |
| `templates/scripts/` | `bridge-stills.mjs` (render still), `sbs_sheet.py` (lembar perbandingan berdampingan) |
| `references/STYLE_BIBLE.md` | Ringkasan tiga formula |
| `references/reports/look.md` | Tone dan efek: nilai, target ukur, yang sudah gagal |
| `references/reports/world.md` | Formula gaya dunia |
| `references/frames/` | Still `LookTest` per waktu, patokan tone dan efek |

## Pasang di proyek Remotion
1. Butuh Remotion dengan `@remotion/three`, `@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`, `three`.
2. Salin `templates/dunia/` ke `src/videos/<nama>/`.
3. Daftarkan di `src/Root.tsx`:
   ```tsx
   import { LookTest, LOOK_FRAMES } from "./videos/<nama>/Short";
   <Composition id="LookTest" component={LookTest} durationInFrames={LOOK_FRAMES} fps={30} width={1080} height={1920} />
   ```
4. Salin `templates/scripts/*` ke `scripts/`, lalu render still:
   `COMP=LookTest REMOTION_TMP=<folder di drive besar> node scripts/bridge-stills.mjs out/look/x_ 45,135,225,315,405 0.5`
5. Bandingkan dengan `references/frames/` (`python scripts/sbs_sheet.py out.jpg --ours ... --ref ...`).

## Aturan kerja
- **Jangan ubah nilai `look.ts` tanpa izin pemilik.** Tone dan efek sudah dikunci.
- **Tone dan efek selalu dipisah.** Tone hanya di `TONE_OF` (cahaya + warna permukaan). Efek hanya di `EFFECT_OF`, `atmos.ts`, `sky.ts`, dan post. Grade tetap netral.
- **Uji tone tanpa efek** dengan `PROPS='{"fx":{...semua false},"post":{"lens":false,"bloom":false}}'` (lihat `look.md` §1).
- **Set baru** dibangun dengan formula `world.md`, lalu harus benar di keempat waktu tanpa mengubah `look.ts`.
- **Setiap cahaya punya sumber kelihatan:** lampu = PointLight di posisi bendanya; glow dan genangan dibuat otomatis dari PointLight di set (`Atmos`).
- **Ukur, jangan menebak:** periksa luma, saturasi, dan sebaran warna terhadap target `look.md` §4 di setiap perubahan.
- **Parameter piksel** (tinta, blur, bloom) ditulis untuk 1080x1920 dan diskalakan dengan tinggi output. Export 2K: `--scale 1.3333333333333333`.

## Catatan teknis
- Satu set = satu `root` + footprint `area`; berikan set ke `new Atmos(set.root, set.area)` supaya efeknya mengikuti set itu.
- `Sky` mengikuti kamera; warna cakrawala = warna kabut, supaya benda jauh melebur ke langit.
- `shade.ts` mengganti rantai cahaya three.js (`lights_fragment_begin`). Kalau versi three berubah dan pengecekan di file itu gagal, sesuaikan string penggantinya.
- Simpan bundle Remotion di drive besar (`REMOTION_TMP`): setiap bundle menyalin `public/` ke folder temp.
