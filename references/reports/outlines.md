# Outlines: garis tinta di dunia 3D

Kode: `templates/dunia/ink.ts` (`InkPass`, pass layar terpisah, dari claude-animated-shorts dengan nilai LOOK v1).

## 1. Di mana tinta muncul
- Siluet terhadap langit dan benda di belakangnya.
- Lompatan kedalaman ≥ 1 % (hanya di sisi yang lebih dekat).
- Lipatan tajam: sudut normal 35° → 50° antar tetangga di kedalaman yang sama (sudut kotak, puncak dinding, kusen).
- Kontak benda dengan tanah.

## 2. Di mana tidak
Kartu (karakter, rumput, bunga), sprite, langit, awan, efek, dan sambungan di dalam satu permukaan (itu dilukis di
tekstur, lihat `textures.md` §3).

## 3. Nilai
| | Nilai |
|---|---|
| Warna | cokelat sangat gelap `#2b201d`, kekuatan 0,9 |
| Lebar | 3,2 px di 6 m → 1,8 px di 90 m (di 1080), diskalakan dengan tinggi output |
| Lipatan | × 0,7 dari lebar siluet |
| Pudar | opasitas jauh 0,7, mulai pudar 120 m, hilang 380 m; ditint ke warna kabut di kejauhan |

## 4. Urutan
Tinta digambar sebelum blur lensa, supaya garis ikut kabur bersama bendanya.

## 5. Akibat untuk bentuk
- Bagian yang ingin tergaris harus timbul 5–20 cm (kusen, lis, balok, papan).
- Benda bulat (pohon, semak, kain) memakai normal halus, supaya tinta tidak jatuh di setiap sisi poligon.
