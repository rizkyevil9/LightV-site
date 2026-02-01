# Digital Yearbook — Kelas XII IPA 3 (Statis)

Situs statis sederhana untuk menyimpan foto, pesan, dan momen Kelas XII IPA 3 — Angkatan 2024.

## Struktur
- `index.html` — Beranda
- `students.html` — Daftar siswa (memuat `data/students.json`)
- `teachers.html` — Wali Kelas & Guru
- `gallery.html` — Galeri momen
- `messages.html` — Pesan & Kesan
- `style.css` — Styling utama
- `scripts.js` — JS minimal (menu & modal)
- `data/students.json` — Sumber data untuk halaman siswa
- `assets/img/` — Tempatkan foto di sini (thumbnail dan HD sesuai nama yang dipakai)

**Catatan**: pastikan file gambar berada di `assets/img/` dengan nama:
- `grathor.jpg`, `karnel.jpg`, `ryn.jpg`, `mirelle.jpg`, `vex.jpg`
- thumbnail opsional: `grathor_thumb.jpg`, dst.
- foto kelas HD: `class_photo_hd.jpg`
- galeri: `praktikum_thumb.jpg`, `praktikum_hd.jpg`, dll.

## Deploy cepat

### Netlify
1. Buat repository git (mis. GitHub) berisi file-file di atas.
2. Login ke https://app.netlify.com → **New site from Git**.
3. Pilih provider (GitHub/GitLab/Bitbucket), pilih repository.
4. Build command: kosong (no build) — Publish directory: root (`/`).
5. Klik deploy. Situs akan tersedia di `*.netlify.app`.

### Cloudflare Pages
1. Push kode ke GitHub.
2. Login ke https://dash.cloudflare.com → Pages → Create a project.
3. Hubungkan repository, pilih branch.
4. Build settings: Framework: None, Build command: kosong, Build directory: `/`.
5. Deploy.

## Tips optimisasi
- Letakkan thumbnail kecil (`*_thumb.jpg`) untuk grid agar cepat dimuat; link gambar HD ke file penuh.
- Gunakan format modern (WebP) bila tersedia.
- Untuk privasi, jangan unggah file gambar yang masih berisi metadata (EXIF) jika tidak ingin berbagi lokasi/identitas.

## Kustomisasi
- Edit `data/students.json` untuk menambah/mengubah siswa.
- Tambah foto ke `assets/img/` dan periksa nama file.
- Untuk menambahkan guru, edit `teachers.html`.
