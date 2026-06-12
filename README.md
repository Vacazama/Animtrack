# AnimTrack — Project Tracker Animasi 2D

Platform gratis untuk tracking episode, task, dan timeline produksi animasi 2D.

---

## 📁 Isi File

```
animtrack/
├── index.html     → Struktur halaman
├── style.css      → Tampilan / desain
├── app.js         → Logika aplikasi
├── vercel.json    → Konfigurasi Vercel
└── README.md      → Panduan ini
```

---

## 🚀 Cara Deploy (Step by Step, tanpa coding!)

### Langkah 1 — Buat akun GitHub
1. Buka https://github.com
2. Klik **Sign up** → isi email, password, username
3. Verifikasi email kamu

### Langkah 2 — Buat repository baru
1. Setelah login, klik tombol **+** di pojok kanan atas
2. Pilih **New repository**
3. Isi nama repo, contoh: `animtrack`
4. Pilih **Public**
5. Klik **Create repository**

### Langkah 3 — Upload file ke GitHub
1. Di halaman repository yang baru dibuat, klik **uploading an existing file**
   (atau klik **Add file** → **Upload files**)
2. Drag & drop semua file berikut ke kotak upload:
   - `index.html`
   - `style.css`
   - `app.js`
   - `vercel.json`
3. Scroll ke bawah, klik **Commit changes**

### Langkah 4 — Buat akun Vercel
1. Buka https://vercel.com
2. Klik **Sign Up**
3. Pilih **Continue with GitHub** → izinkan akses
4. Akun otomatis terhubung ke GitHub kamu

### Langkah 5 — Deploy ke Vercel
1. Di dashboard Vercel, klik **Add New Project**
2. Pilih repository `animtrack` dari daftar
3. Klik **Import**
4. Biarkan semua pengaturan default
5. Klik **Deploy**
6. Tunggu beberapa detik...
7. **Selesai!** Kamu mendapat link seperti `animtrack-xxx.vercel.app`

---

## ✅ Fitur

- **Dashboard** — Ringkasan progress, statistik, grafik status task
- **Episode** — Kelola episode/scene dengan deadline & catatan
- **Task** — Assign task ke Tim Ilustrasi / Editing, lengkap dengan PIC & deadline
- **Timeline** — Visualisasi jadwal otomatis berdasarkan deadline

## 💾 Penyimpanan Data

Data tersimpan di **localStorage** browser — artinya data tersimpan di komputer/browser masing-masing pengguna. Untuk berbagi data antar tim, silakan hubungi pengembang untuk versi dengan database online.

---

## 🔄 Update Aplikasi

Jika ingin mengubah tampilan atau menambah fitur:
1. Edit file di GitHub langsung (klik nama file → ikon pensil)
2. Simpan (Commit changes)
3. Vercel otomatis update dalam 1–2 menit

---

Dibuat dengan ❤️ untuk tim animasi 2D
