# Textures: formula gaya dunia

Resep gaya model dunia 3D untuk latar apa pun: kampung, kota modern, kota abad pertengahan, hutan, atau interior.
Template repo ini belum berisi set yang dibangun dengan formula ini; `TestSet` di `build.ts` hanya bentuk polos untuk
menguji tone dan efek.

## 1. Gaya yang dituju
Dunia 3D kartun yang terlihat seperti ilustrasi buku cerita yang dilukis rapi: bentuk sederhana dan tebal, warna cerah
tapi lembut, garis tinta tipis, detail digambar dengan tangan, cahaya hangat, terasa "mahal" tapi tidak realistis.
Full three.js: tanpa gambar AI, tanpa tekstur foto.

## 2. Bentuk
1. Primitif tebal dan sederhana: kotak, silinder, kerucut, atap pelana. Proporsi sedikit dilebihkan (menara gemuk,
   atap besar, pintu dan jendela agak besar).
2. Bagian penting dibuat timbul 5–20 cm (kusen, lis, balok, papan nama, gapura, alas batu), supaya pass tinta
   menangkap bentuknya.
3. Tidak ada detail geometri kecil; detail ada di tekstur.
4. Benda bulat (pohon, semak, kain) memakai normal halus.

## 3. Tekstur (Canvas2D, UV dalam meter, ~256 px per meter)
1. Warna dasar datar dan gradasi sangat lembut yang lebar. Tanpa noise, tanpa foto, tanpa butiran halus berlebih.
2. Setiap unsur digambar satu per satu dengan nada sedikit berbeda:
   - bata 25 x 6,5 cm;
   - balok batu besar 75–135 x 55 cm: tepi agak bergelombang, sisi bawah lebih gelap, sisi atas lebih terang,
     sesekali retak;
   - papan 20 cm; genteng berbaris melengkung; jerami berlapis; gedek anyaman; beton berpanel; ubin 50 cm; paving.
3. Garis sambungan di DALAM permukaan memakai nada lebih gelap dari warna permukaan itu sendiri (sekitar × 0,35–0,45),
   bukan hitam. Jangan melukis garis di tepi geometri asli (jadi garis dobel dengan tinta).
4. Tanah jalan: oker-cokelat, sapuan searah jalan, dua jejak roda berupa pita sedikit lebih gelap dengan tepi gelap
   tipis, kerikil pucat kecil berbayang, satu baris rumput pendek di tengah.
5. Seamless: unsur yang melewati tepi tile digambar ulang di sisi seberang.
6. Palet hangat dan diredam (lihat `lighting.md` §3).

## 4. Vegetasi
- Pohon dan semak: gumpalan bulat bergaris dengan bintik daun lebih gelap dan terang; batang meruncing.
- Rumput dan bunga: kartu kecil bergaris yang selalu menghadap kamera.

## 5. Kepadatan
Setiap set penuh properti yang menceritakan tempatnya (tong, peti, karung, papan nama, lampu, pagar, pot, jemuran,
sandal, sepeda, tenda belang, spanduk). Semua dibuat sebagai komponen berparameter yang bisa dipakai ulang.

## 6. Kedalaman dan kamera
Lihat `depth.md` §4 dan §7: latar jauh tetap 3D, pemandangan di balik gerbang 3D sungguhan, kamera tegak dengan shift
lens, set disusun seperti panggung untuk kameranya.

## 7. Syarat set baru
Benar di keempat waktu (pagi, siang, sore, malam) tanpa mengubah `lights.ts`; setiap lampu = `PointLight` di posisi
bendanya; footprint set (`area`) diberikan ke `Atmos`.
