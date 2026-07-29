# CIES Photobooth Application

Aplikasi Web Photobooth interaktif dan modern yang dibangun menggunakan **React (Vite)** di sisi Frontend dan **Express.js (Node.js)** dengan database **SQLite (better-sqlite3)** di sisi Backend.

---

## 📁 Struktur Folder Proyek

Struktur folder dikelompokkan secara rapi dan modular memisahkan tanggung jawab **Frontend** dan **Backend**:

```
ciesphotobooth/
├── public/                 # Aset statis & berkas hasil unggahan pengguna
│   ├── uploads/            # Direktori penyimpanan berkas yang diunggah
│   │   ├── frames/         # Berkas bingkai/frame yang diunggah admin
│   │   ├── stickers/       # Berkas stiker yang diunggah admin
│   │   └── proofs/         # Bukti transfer pembayaran sesi
│   └── qris.jpeg           # Gambar QRIS untuk pembayaran
│
├── server/                 # Sisi Backend (Express.js)
│   ├── config/             # Konfigurasi aplikasi & koneksi Database SQLite
│   │   └── database.ts     # Inisialisasi & sinkronisasi database SQLite
│   ├── controllers/        # Logika bisnis & pengolah request/response API
│   │   ├── package.controller.ts
│   │   ├── frame.controller.ts
│   │   ├── sticker.controller.ts
│   │   └── session.controller.ts
│   ├── middleware/         # Middleware Express (Upload Multer, dll)
│   │   └── upload.ts
│   └── routes/             # Pemetaan endpoint REST API
│       ├── index.ts        # Router utama backend
│       ├── package.routes.ts
│       ├── frame.routes.ts
│       ├── sticker.routes.ts
│       └── session.routes.ts
│
├── src/                    # Sisi Frontend (React + Vite + Tailwind CSS)
│   ├── assets/             # Gambar, ikon, & aset visual frontend
│   ├── components/         # Komponen UI reusable (Modal, Button, Navbar, dll)
│   ├── pages/              # Halaman-halaman aplikasi
│   │   ├── admin/          # Halaman Admin (Dashboard, Kelola Paket, Frame, Sesi, Stiker)
│   │   └── user/           # Halaman Pengguna (Landing, Pilih Paket, Kasir, Booth Foto)
│   ├── services/           # Service penanganan fetch API ke Backend
│   │   └── api.ts
│   ├── App.tsx             # Routing & Komponen Utama Frontend
│   ├── index.css           # Styling Global (Tailwind CSS)
│   ├── main.tsx            # Entry point React
│   └── types.ts            # Definisi Interface & Type TypeScript
│
├── .env.example            # Contoh variabel lingkungan / environment
├── index.html              # Entry point HTML aplikasi web
├── package.json            # Berkas dependensi & skrip npm
├── server.ts               # Entry point server Express.js
├── tsconfig.json           # Konfigurasi TypeScript
└── vite.config.ts          # Konfigurasi Vite
```

---

## 🚀 Fitur Utama

### 👤 Fitur Pengguna (User)
- **Pemilihan Paket Photobooth**: Memilih paket foto berdasarkan durasi, jumlah foto, dan harga.
- **Kasir & Pembayaran QRIS**: Menginput nama pelanggan dan melakukan konfirmasi pembayaran via QRIS dengan mengunggah bukti transfer.
- **Studio Photobooth Interaktif**: 
  - Kamera live preview dengan countdown otomatis & flash visual.
  - Sesi jepret foto berulang sesuai kuota paket.
- **Foto Editor / Dekorasi**:
  - Pilihan filter warna foto.
  - Pilihan bingkai (frame) dinamis dari database.
  - Tambah & atur posisi stiker pada cetakan foto.
- **Cetak / Unduh Strip Foto**: Mengunduh hasil kombinasi strip foto resolusi tinggi.

### 🛡️ Fitur Panel Admin
- **Manajemen Sesi Pelanggan**: Melihat daftar transaksi, menyetujui (approve) sesi, dan menghapus sesi.
- **Manajemen Paket Foto**: Menambah, mengedit, dan menghapus opsi paket photobooth.
- **Manajemen Bingkai (Frame)**: Mengunggah berkas frame baru dan menentukan kuota foto untuk frame tersebut.
- **Manajemen Stiker**: Mengunggah dan mengelola koleksi stiker dekorasi.
- **Ringkasan Pendapatan & Statistik**: Laporan statistik transaksi dan total pendapatan.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React (Icons), Motion (Animations), Canvas API.
- **Backend**: Node.js, Express.js, TypeScript, Better-SQLite3 (Database), Multer (File Upload).
- **Tooling & Build**: Vite, esbuild, tsx.

---

## 💻 Cara Menjalankan Aplikasi

### 1. Prasyarat
Pastikan Anda sudah menginstal **Node.js** (versi 18 ke atas) dan **npm** di komputer Anda.

### 2. Instalasi Dependensi
Jalankan perintah berikut di terminal root proyek:
```bash
npm install
```

### 3. Menjalankan Mode Pengembang (Development)
Untuk menjalankan frontend dan backend secara bersamaan:
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:3000`.

### 4. Build untuk Production
Untuk membuat bundle siap produksi:
```bash
npm run build
```
Lalu jalankan server produksi dengan:
```bash
npm run start
```

---

## 🌐 Endpoint REST API Utama

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/packages` | Mengambil semua paket foto |
| `POST` | `/api/packages` | Menambah paket foto baru (Admin) |
| `PUT` | `/api/packages/:id` | Memperbarui data paket foto (Admin) |
| `DELETE` | `/api/packages/:id` | Menghapus paket foto (Admin) |
| `GET` | `/api/frames` | Mengambil daftar bingkai/frame |
| `POST` | `/api/frames` | Mengunggah bingkai baru (Admin) |
| `GET` | `/api/stickers` | Mengambil daftar stiker |
| `POST` | `/api/stickers` | Mengunggah stiker baru (Admin) |
| `POST` | `/api/sessions` | Membuat sesi transaksi pengguna baru |
| `POST` | `/api/sessions/:id/proof` | Mengunggah bukti transfer pembayaran |
| `GET` | `/api/admin/sessions` | Mengambil daftar semua sesi transaksi (Admin) |

---

## 📄 Variabel Lingkungan (.env)

Buat berkas `.env` berdasarkan contoh di `.env.example` jika diperlukan:

```env
APP_URL=http://localhost:3000
```
