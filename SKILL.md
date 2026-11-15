---
name: animated-short
description: Locked look (tone + effects for morning / noon / dusk / night) and the world-style formula for vertical 3D cartoon-world shorts rendered with three.js inside Remotion. Use when building or checking a 3D world set for these shorts, when changing light or atmosphere, or when the user says "pakai look dunia" / "use the animated-short look".
---

# Animated short: look dan gaya dunia (three.js + Remotion)

Template: `templates/dunia/` (komposisi `LookTest`, 1080x1920, 30 fps). Laporan: `references/reports/`.

Isi skill ini hanya yang sudah ditetapkan:
1. **Tone** empat waktu (pagi, siang, sore, malam).
2. **Efek** empat waktu (kabut, berkas cahaya, glow lampu, kabut tanah, partikel, matahari/bulan, blur lensa, bloom, vignette).
3. **Formula gaya dunia** (bentuk, tekstur, garis, vegetasi, kepadatan, kedalaman, kamera).

Karakter, gerak kamera per adegan, naskah, suara, audio, dan QA video penuh belum termasuk.

## Pipeline
1. **Pasang template.** Butuh Remotion dengan `@remotion/three`, `@react-three/fiber`, `@react-three/postprocessing`,
   `postprocessing`, `three`. Salin `templates/dunia/` ke `src/videos/<nama>/` dan daftarkan di `src/Root.tsx`:
   ```tsx
   import { LookTest, LOOK_FRAMES } from "./videos/<nama>/Dunia";
   <Composition id="LookTest" component={LookTest} durationInFrames={LOOK_FRAMES} fps={30} width={1080} height={1920} />
   ```
   Salin `templates/scripts/*` ke `scripts/`.
2. **Cek look.** Render still kelima shot (pagi, siang, sore, malam, sore ke matahari):
   `COMP=LookTest REMOTION_TMP=<folder di drive besar> node scripts/bridge-stills.mjs out/look/x_ 45,135,225,315,405 0.5`.
   Bandingkan dengan `references/frames/`: `python scripts/sbs_sheet.py out.jpg --ours ... --ref ...`.
3. **Bangun set.** Set baru mengikuti `reports/textures.md` (bentuk, tekstur, vegetasi, kepadatan) dan
   `reports/outlines.md`. Satu set = satu `root` + footprint `area`. Taruh di `build.ts`, ganti `TestSet` di `world.ts`,
   dan berikan set ke `new Atmos(set.root, set.area)`.
4. **Rencanakan shot** di `story.ts`: `SHOTS` (frame + waktu), kunci kamera per shot, `DOF`, `SHIFT`.
5. **Cek di keempat waktu** tanpa mengubah `lights.ts`, lalu ukur terhadap target `reports/lighting.md` §6.

## Aturan kerja
- **Jangan ubah nilai `lights.ts` tanpa izin pemilik.** Tone dan efek sudah dikunci.
- **Tone dan efek selalu dipisah.** Tone hanya di `TONE_OF` (cahaya + warna permukaan). Efek hanya di `EFFECT_OF`,
  `world.ts` (`Sky`, `Atmos`), dan post. Grade tetap netral (`reports/grade.md`).
- **Uji tone tanpa efek:** render dengan semua saklar `fx` dan `post.lens` / `post.bloom` mati (`reports/lighting.md` §1).
- **Setiap cahaya punya sumber kelihatan:** lampu = `PointLight` di posisi bendanya; glow dan genangan dibuat otomatis
  dari lampu di set.
- **Ukur, jangan menebak:** luma, saturasi, dan sebaran warna terhadap target di setiap perubahan.
- **Parameter piksel** (tinta, blur, bloom) ditulis untuk 1080x1920 dan diskalakan dengan tinggi output.
  Export 2K: `--scale 1.3333333333333333`.

## Look-match loop (kalau look perlu dicocokkan lagi)
1. **Ukur dulu.** Satu agen per topik menulis angka ke `references/reports/<topik>.md`; laporan adalah sumber kebenaran.
2. **Sandbox, satu pemilik per file.** Salin folder ke `src/videos/<nama>_{cam,world,mat,post}` dengan entry
   `src/sandboxes/<n>/index.tsx` (contoh: `templates/sandbox_index_example.tsx`). Pemilik:
   - cam: `story.ts`
   - world: `world.ts`, `lights.ts`, `shade.ts`, `grade.ts`
   - mat: `paint.ts`, `build.ts`
   - post: `ink.ts`, `Dunia.tsx`, `lensblur.ts`
   Render sandbox: `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx node scripts/bridge-stills.mjs out/<nama>/<n>/x_ <frames> 0.5`.
3. **Gabung** dengan `REMOTION_ROOT=. SHORT=<nama> python scripts/bridge_merge.py [cam,world,mat,post]` (main dicadangkan
   dulu), lalu `npx tsc --noEmit`, lalu salin ulang main ke setiap sandbox.
4. **Verifikasi** dengan agen baru: lembar perbandingan berdampingan, nilai per bidang (tone pagi/siang/sore/malam,
   efek, tinta, kedalaman) + daftar perbaikan bernomor dengan nomor frame. Setiap perbaikan dikirim ke pemilik filenya.

## Catatan teknis
- `Sky` mengikuti kamera; warna cakrawala = warna kabut, supaya benda jauh melebur ke langit.
- `shade.ts` mengganti rantai cahaya three.js (`lights_fragment_begin`). Kalau versi three berubah dan pengecekan di
  file itu gagal, sesuaikan string penggantinya.
- Simpan bundle Remotion di drive besar (`REMOTION_TMP`): setiap bundle menyalin `public/` ke folder temp.
- File `.ts` sementara di dalam `out/` ikut diperiksa `tsc`; beri nama `.txt`.
