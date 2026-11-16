# Aset: kalau benda yang dibutuhkan belum ada

Repo ini menyimpan **cara** membuat dunia, bukan stok semua benda. Tiap short menambah pustaka.

## Dua jenis benda
- **Sederhana** (dinding, lantai, jalan, gedung, papan nama, kertas, tekstur): dibuat di kode dengan formula gaya dunia
  (`STYLE_BIBLE.md`, `reports/textures.md`).
- **Kompleks dan hampir realistis** (kendaraan, perabot kaya detail, properti rumit): **model 3D jadi**. Benda seperti
  ini yang dirakit dari kotak di kode terbaca aneh (uji 2026-11-16: mobil buatan kode ditolak).

## Alur per short
1. Dari naskah, tulis daftar benda per shot.
2. Cek pustaka proyek (`public/models/<grup>/`, lihat `CREDITS.md` di tiap grup). Yang ada dipakai ulang.
3. Benda kompleks yang belum ada: cari kandidat dan buat lembar pratinjau bernomor:
   ```
   python templates/scripts/find_asset.py "police car" --n 6 --out shorts/_aset/cari
   ```
   Hasil: `<benda>.jpg` (pratinjau bernomor) + `<benda>.md` (nama, pembuat, lisensi, jumlah segitiga, tautan, baris
   kredit). Sumber: **Poly Haven** (CC0, unduh langsung tanpa login) dan **Sketchfab** (hanya model yang bisa diunduh
   dengan lisensi CC0 atau CC BY). Yang diunduh hanya gambar pratinjau kecil.
4. Pemilik memilih nomor. Unduh **glTF/GLB**, pilih tekstur 1k kalau ada (cukup tajam untuk 1080, ringan dirender).
   Sketchfab butuh login akun pemilik sendiri; kredensial tidak disimpan di mana pun.
5. Simpan di `public/models/<grup>/` dan tambah baris di `public/models/<grup>/CREDITS.md`.
6. Muat lewat `templates/dunia/models.ts`:
   - `loadModel(path)`: dimuat sekali (cache), `.clone(true)` untuk salinan berikutnya (bukan untuk model ber-rig).
   - `splitPack(scene, /body$/i, /^Wheel_/)`: memisah paket berisi banyak benda dalam satu adegan, lalu memutarnya
     lewat sumbu bagian-bagiannya.
   - `fit(obj, panjang)`: berdiri di tanah (di bawah ban kalau ada roda), panjang menurut sumbu z, diskalakan ke ukuran
     nyata, dan berada di tengah.
   - **Muat sebelum adegan dibangun.** Komposisi menunggu `load…()` (delayRender), lalu baru memasang `ThreeCanvas`.
     Kalau dimuat setelah adegan jadi, benda tidak ikut di frame pertama.
7. Uji render siang dan malam, lalu cek berdampingan dengan acuan.

## Look pada model jadi
- Material PBR asli model **dipertahankan**: cat mobil acuan mengkilap. `scene.environment` = RoomEnvironment (PMREM)
  untuk pantulan, intensitas 1,0 siang dan .12 malam. Hanya material standar yang memakainya; dunia (Lambert dua tingkat)
  tidak berubah.
- Garis tinta tetap otomatis lewat `InkPass`.
- Benda berwarna yang dipilih harus cocok dengan palet vivid (jenuh, tidak kusam).

## Lisensi
- **CC0**: bebas, tanpa kredit.
- **CC BY 4.0**: wajib mencantumkan pembuat di **deskripsi setiap video** yang memakainya. Contoh baris:
  `3D car models: "Police car" by SpatialNeglect and "Generic passenger car pack" by Comrade1280 (Sketchfab), CC BY 4.0.`
- Lisensi lain (NC, ND, "royalty free" khusus toko): jangan dipakai di video yang dimonetisasi.

## Risiko
- Benda khas daerah (angkot, bajaj, motor bebek, rumah kampung) jarang ada versi gratis yang bagus. Pilihannya beli
  model atau sederhanakan shot-nya.
- Model sangat berat (lebih dari 300 ribu segitiga): ambil versi tekstur 1k, dan pakai hanya untuk benda dekat kamera.

## Pustaka yang sudah teruji
| Grup | File | Model | Pembuat | Lisensi |
|---|---|---|---|---|
| cars | `police_car.glb` | [Police car](https://sketchfab.com/3d-models/police-car-9166b13b6ae341f4bfc093edb71d74f4) (Crown Vic, ber-rig) | SpatialNeglect | CC BY 4.0 |
| cars | `generic_passenger_car_pack.glb` | [Generic passenger car pack](https://sketchfab.com/3d-models/generic-passenger-car-pack-20f9af9b8a404d5cb022ac6fe87f21f5) (±10 mobil) | Comrade1280 | CC BY 4.0 |

File model tidak ada di repo (ukurannya besar). Unduh dari tautan di atas.
