# Light V Image AI

Website generator gambar AI ringan dengan frontend statis + Vercel Serverless Function.

## Deploy tercepat

1. Upload folder ini ke GitHub.
2. Import repository ke Vercel.
3. Di **Project Settings → Environment Variables**, buat:
   - Name: `POLLINATIONS_API_KEY`
   - Value: API key Pollinations milikmu (`sk_...`)
4. Deploy.
5. Buka URL Vercel. Selesai.

## Kenapa memakai backend?
API key rahasia tidak diletakkan di `index.html`, sehingga pengunjung tidak bisa melihat secret key hanya dari source page.

## Local test

```bash
npm install
npx vercel dev
```

## Model
Model dipilih dari beberapa model yang tersedia pada Pollinations. Daftar model dapat berubah; server sengaja memakai allowlist agar input dari browser tidak bebas memasukkan parameter sembarangan.
