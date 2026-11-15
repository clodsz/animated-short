# Grade: netral

Kode: `templates/dunia/grade.ts` (`GradeEffect`, `GRADES`), vignette diatur di `Dunia.tsx`.

## 1. Aturan
Grade warna **netral** untuk semua waktu: kurva lurus (y = x di 7 titik), saturasi 1, tanpa tint.
Tone sepenuhnya di cahaya dan warna permukaan (`lighting.md`).

## 2. Kenapa
Tone lewat grade (mengangkat bayangan, tint, menekan saturasi) menaruh lapisan "susu" di atas seluruh frame dan
mencampur tone dengan efek. Ditolak.

## 3. Rantai post
`InkPass` → blur lensa (pre + main) → bloom → tone map NEUTRAL → grade (netral + vignette). MSAA 4.
Grade bekerja di nilai tampilan (setelah tone map).

## 4. Vignette (efek)
Kekuatan .18 di pagi, siang, dan sore; .32 di malam. Mulai di radius .42. Bisa dimatikan dengan `fx.vig`.

## 5. Film grain
Tidak dipakai.
