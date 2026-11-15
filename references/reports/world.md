# Formula gaya dunia

Formula ini adalah resep gaya model dunia 3D. Ia berlaku untuk latar apa pun: kampung, kota modern, kota abad
pertengahan, hutan, atau interior. Template di repo ini belum berisi set yang dibangun dengan formula ini;
`testset.ts` hanya bentuk polos untuk menguji tone dan efek.

## Gaya yang dituju
Dunia 3D kartun yang terlihat seperti ilustrasi buku cerita yang dilukis rapi: bentuk sederhana dan tebal, warna cerah
tapi lembut, garis tinta tipis, detail digambar dengan tangan, cahaya hangat, terasa "mahal" tapi tidak realistis.
Full three.js: tanpa gambar AI, tanpa tekstur foto.

## 1. Bentuk
1. Primitif tebal dan sederhana: kotak, silinder, kerucut, atap pelana. Proporsi sedikit dilebihkan (menara gemuk,
   atap besar, pintu dan jendela agak besar).
2. Bagian penting dibuat timbul 5–20 cm (kusen, lis, balok, papan nama, gapura, alas batu), supaya pass tinta
   menangkap bentuknya.
3. Tidak ada detail geometri kecil; detail ada di tekstur.
4. Benda bulat (pohon, semak, kain, rantai) memakai normal halus, supaya tinta hanya jatuh di siluet dan lipatan
   besar, bukan di setiap sisi poligon.

## 2. Tekstur (Canvas2D, UV dalam meter, ~256 px per meter)
1. Warna dasar datar dan gradasi sangat lembut yang lebar. Tanpa noise, tanpa foto, tanpa butiran halus berlebih.
2. Setiap unsur digambar satu per satu dengan nada sedikit berbeda:
   - bata 25 x 6,5 cm;
   - balok batu besar 75–135 x 55 cm: tepi agak bergelombang, sisi bawah lebih gelap, sisi atas lebih terang,
     sesekali retak;
   - papan 20 cm; genteng berbaris melengkung; jerami berlapis; gedek anyaman; beton berpanel; ubin 50 cm; paving.
3. Tanah jalan: oker-cokelat, sapuan searah jalan, dua jejak roda berupa pita sedikit lebih gelap dengan tepi gelap
   tipis, kerikil pucat kecil berbayang, satu baris rumput pendek di tengah.
4. Garis sambungan di DALAM permukaan memakai nada lebih gelap dari warna permukaan itu sendiri (sekitar x0,35–0,45),
   bukan hitam. Jangan melukis garis di tepi geometri asli (jadi garis dobel).
5. Tekstur seamless: unsur yang melewati tepi tile digambar ulang di sisi seberang.

## 3. Garis tinta
Siluet, lompatan kedalaman, dan lipatan tajam diberi tinta cokelat sangat gelap `#2b201d`, ~3 px di 1080 untuk benda
dekat, menipis dan memudar di kejauhan (`templates/dunia/ink.ts`). Kartu (karakter, rumput, bunga) tidak ikut digaris.

## 4. Vegetasi
Pohon dan semak berupa gumpalan bulat bergaris dengan bintik daun lebih gelap dan terang. Batang meruncing.
Rumput dan bunga berupa kartu kecil bergaris yang selalu menghadap kamera.

## 5. Kepadatan
Setiap set penuh properti yang menceritakan tempatnya (tong, peti, karung, papan nama, lampu, pagar, pot, jemuran,
sandal, sepeda, tenda belang, spanduk). Semua dibuat sebagai komponen berparameter yang bisa dipakai ulang.

## 6. Kedalaman dan kamera
- Benda jauh tetap geometri 3D sederhana yang ikut perspektif; lapisan paling jauh (gunung, siluet kota) boleh lukisan
  datar berlapis yang memudar dalam kabut.
- Pemandangan di balik pintu atau gerbang dibangun 3D sungguhan, bukan gambar tempel.
- Kamera tegak (garis vertikal tetap tegak); bingkai digeser dengan shift lens (`SHIFT` di `story.ts`), tidak
  didongakkan. Set disusun seperti panggung untuk kameranya.

## 7. Tone dan efek
Ikuti `look.md`. Set baru harus benar di keempat waktu (pagi, siang, sore, malam) tanpa mengubah nilai `look.ts`.
Palet benda hangat dan diredam: warna netral atau abu-abu jadi lavender di bayangan biru-ungu.
