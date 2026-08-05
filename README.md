# CIES Photobooth Application

Aplikasi Web Photobooth interaktif dan modern yang dibangun menggunakan **React (Vite)** di sisi Frontend dan **Express.js (Node.js)** serta **Firebase (Firestore & Firebase Storage)** sebagai layanan database & media storage.

---

## 📁 Struktur Folder Proyek

Struktur folder dikelompokkan secara rapi dan modular memisahkan tanggung jawab **Frontend** dan **Backend**:

```
ciesphotobooth/
├── public/                 # Aset statis & berkas bawaan aplikasi
│   └── qris.jpeg           # Gambar QRIS untuk pembayaran
│
├── server/                 # Sisi Backend (Express.js)
│   ├── config/             # Konfigurasi aplikasi & koneksi Database
│   │   └── database.ts     # Inisialisasi & sinkronisasi database
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
│   ├── lib/                # Konfigurasi & Inisialisasi Firebase Cloud Services
│   │   └── firebase.ts
│   ├── pages/              # Halaman-halaman aplikasi
│   │   ├── admin/          # Halaman Admin (Dashboard, Kelola Paket, Frame, Pembayaran, Stiker, Laporan)
│   │   └── user/           # Halaman Pengguna (Landing, Pilih Paket, Kasir, Studio Booth, Editor Foto)
│   ├── services/           # Service penanganan fetch API & database
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
  - **Photo Strip**: Memilih hingga 4 foto terbaik untuk dirangkai menjadi cetakan foto strip berframe.
  - **Foto Individual**: Melihat dan mengunduh seluruh hasil foto tangkapan kamera secara individual satu per satu atau sekaligus.
  - **Filter & Bentuk Foto**: Pilihan filter warna serta bentuk sudut foto (Normal, Rounded, Circle, Heart).
  - **Frame & Stiker**: Pilihan bingkai dinamis dan koleksi stiker dekorasi yang bisa diatur posisinya.

### 🛡️ Fitur Panel Admin
- **Riwayat Pembayaran**: Melihat daftar riwayat pembayaran pelanggan, melihat bukti transfer, dan menghapus riwayat.
- **Kelola Paket**: Menambah, mengedit, dan menghapus opsi paket photobooth.
- **Kelola Frame**: Mengunggah berkas frame baru dan menentukan kuota foto untuk frame tersebut.
- **Kelola Stiker**: Mengunggah dan mengelola koleksi stiker dekorasi.
- **Laporan Transaksi**: Laporan statistik transaksi dan total pendapatan.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React (Icons), Motion (Animations), Konva (Canvas API).
- **Backend & Storage**: Node.js, Express.js, TypeScript, Firebase Firestore & Storage, Multer.
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

Buat berkas `.env` berdasarkan contoh di `.env.example`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```
