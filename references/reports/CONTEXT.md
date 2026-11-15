# Konteks bersama untuk setiap agen (baca penuh sebelum mulai)

## Tujuan
Short vertikal 1080x1920, 30 fps: karakter kartun 2D di dunia 3D yang dirender dengan three.js di Remotion.
Tanpa generator video AI, tanpa tekstur foto. Yang sudah ditetapkan dan dikunci: **tone** dan **efek** empat waktu
(pagi, siang, sore, malam) dan **formula gaya dunia**. Laporan di folder ini adalah sumber kebenarannya; angka, bukan
kata sifat.

## Laporan
| File | Isi |
|---|---|
| `lighting.md` | Tone per waktu (cahaya + warna permukaan), lampu, efek per waktu, target ukur |
| `depth.md` | Kabut jarak, berkas cahaya, kabut tanah, latar jauh, blur lensa, bloom, kamera tegak + shift lens |
| `grade.md` | Grade warna netral, vignette |
| `outlines.md` | Garis tinta di dunia 3D |
| `textures.md` | Formula gaya dunia: bentuk, tekstur lukis, vegetasi, kepadatan properti |

## Kode
`templates/dunia/` (susunan sama dengan template short sebelumnya):

| File | Pemilik (alur sandbox) | Isi |
|---|---|---|
| `lights.ts` | world | `TONE_OF` (tone), `EFFECT_OF` (efek), saklar `FX` |
| `world.ts` | world | langit (`Sky`), efek atmosfer (`Atmos`), `World` (cahaya kunci, kabut, pose per frame) |
| `shade.ts` | world | shading dua-tingkat untuk semua material dunia |
| `grade.ts` | world | grade netral + vignette |
| `paint.ts` | mat | tekstur Canvas: awan, sprite matahari/bulan/sunburst, sprite efek |
| `build.ts` | mat | `lam`, `quad`, `boxGeo`, `Batch`, dan `TestSet` (bentuk polos untuk uji look) |
| `story.ts` | cam | daftar shot (waktu per shot), kunci kamera, blur lensa per shot, shift lens |
| `ink.ts`, `lensblur.ts`, `Dunia.tsx` | post | pass tinta, blur lensa, rantai post, komposisi `LookTest` |

## Belum termasuk
Karakter, gerak kamera per adegan, naskah, suara, audio, dan QA video penuh. Jangan menambahkannya ke repo sebelum
diputuskan pemilik.
