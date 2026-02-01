# Digisign - Disdikpora Kabupaten Lingga

Sistem Manajemen Sertifikat Digital yang aman, efisien, dan modern. Proyek ini dikembangkan untuk mempermudah proses pembuatan, penandatanganan, verifikasi, dan distribusi sertifikat digital menggunakan teknologi web terkini.

## 🚀 Fitur Utama

### 1. **Pembuatan & Upload Sertifikat**
*   **Editor Drag-and-Drop:** Upload file PDF dan tambahkan elemen (QR Code, tanda tangan, teks) secara visual.
*   **Batch Processing:** Upload dan proses hingga 50 sertifikat sekaligus.
*   **Metadata Otomatis:** Sistem mendeteksi nama pemilik dari nama file.
*   **QR Code Generator:** Generate QR Code unik untuk verifikasi keaslian.

### 2. **Sistem Persetujuan (Approval Workflow)**
*   **Multi-Signer:** Mendukung alur persetujuan dengan lebih dari satu penandatangan.
*   **Role-Based Access:**
    *   **SUPERADMIN:** Mengelola user, menghapus sertifikat, melihat statistik.
    *   **SIGNER:** Menyetujui atau menolak sertifikat yang masuk.
*   **Bulk Approval:** Penyetuju dapat menyetujui banyak sertifikat sekaligus dengan satu klik.

### 3. **Verifikasi & Keamanan**
*   **Hashing Kriptografi:** Menggunakan algoritma ECDSA untuk tanda tangan digital.
*   **Dual Verification:**
    *   **Scan QR Code:** Verifikasi instan menggunakan kamera HP.
    *   **Input ID:** Verifikasi manual dengan memasukkan Serial Number unik.
*   **Validation Check:** Menampilkan detail validitas, penandatangan, dan integritas data.

### 4. **Manajemen Data**
*   **Dashboard Interaktif:** Grafik statistik sertifikat (Pending, Approved, Rejected).
*   **Batch Download:** Unduh semua sertifikat yang telah disetujui.
*   **PDF Preview:** Lihat file fisik sertifikat langsung dari dashboard.

---

## 🛠 Teknologi yang Digunakan

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Directory)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Database:** [MySQL](https://www.mysql.com/) (via Prisma ORM)
*   **Authentication:** Custom Server-Side Session (JWT Cookies)
*   **PDF Manipulation:** `pdfjs-dist`, `pdf-lib`
*   **Cryptography:** Custom ECDSA Implementation
*   **Other Tools:** `lucide-react` (Icons), `html5-qrcode` (Scanner), `qrcode.react`.

---

## 📦 Prasyarat

Pastikan Anda telah menginstal:
*   **Node.js** (Versi 18 atau terbaru)
*   **npm**
*   **MySQL** (via XAMPP atau standalone)
*   **Git**

---

## 🔧 Cara Instalasi & Menjalankan Proyek

Ikuti langkah-langkah ini untuk menjalankan proyek di perangkat Anda:

### 1. Clone Repository
```bash
git clone https://github.com/nowarlove/pdfeditor.git
cd digisign-disdikpora
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Lingkungan (Environment Variables)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Edit file `.env` dan sesuaikan konfigurasi:
```env
DATABASE_URL="mysql://root:@localhost:3306/pdf_editor"
JWT_SECRET="your-secret-key-here"
```

### 4. Setup Database
Pastikan MySQL sudah berjalan (via XAMPP atau standalone), lalu jalankan:
```bash
npx prisma db push
```

Seed database dengan data awal (Super Admin & Signers):
```bash
npx prisma db seed
```

### 5. Menjalankan Server Development
```bash
npm run dev
```
Akses aplikasi di [http://localhost:3000](http://localhost:3000).

---

## 🌐 Menjalankan dengan HTTPS via ngrok

Fitur **QR Scanner** memerlukan HTTPS untuk mengakses kamera. Gunakan **ngrok** untuk membuat tunnel HTTPS.

### 1. Install ngrok

**Opsi A - Download langsung:**
1. Buka https://ngrok.com/download
2. Download versi sesuai OS Anda
3. Extract ke folder yang mudah diakses

**Opsi B - Via npm:**
```bash
npm install -g ngrok
```

### 2. Buat Akun ngrok (Gratis)
1. Daftar di https://dashboard.ngrok.com/signup
2. Setelah login, copy **Authtoken** dari dashboard

### 3. Setup Authtoken
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

### 4. Jalankan Aplikasi + ngrok

**Terminal 1 - Jalankan Next.js:**
```bash
npm run dev
```

**Terminal 2 - Jalankan ngrok:**
```bash
ngrok http 3000
```

### 5. Gunakan URL HTTPS
Setelah ngrok berjalan, Anda akan melihat output seperti:
```
Forwarding    https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

✅ Gunakan URL `https://abc123xyz.ngrok-free.app` untuk mengakses aplikasi dengan HTTPS!

> **Catatan:** Saat pertama kali dibuka, ngrok akan menampilkan halaman "Visit Site" - klik tombol tersebut untuk lanjut ke aplikasi.

---

## 🔐 Akun Default

Setelah database di-seed, gunakan akun berikut untuk login:

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `admin` | `admin123` |
| Signer 1 | `leonardo` | `12345678` |
| Signer 2 | `pusyu` | `12345678` |

---

## 🔄 Update Proyek

Untuk mengambil update terbaru dari repository:
```bash
git pull
npm install
npx prisma db push
npm run dev
```

---

## 📂 Struktur Folder

*   `app/`: Pages dan API Routes (Next.js App Router).
*   `components/`: Komponen UI reusable (Sidebar, PDF viewer, dll).
*   `lib/`: Helper functions (Crypto, PDF processing, Auth).
*   `prisma/`: Schema database dan migrasi.
*   `public/`: Aset statis (Images, Uploads).
    *   `uploads/certificates/`: Tempat penyimpanan file PDF fisik.

---

## ⚠️ Troubleshooting

### Database tidak terkoneksi
- Pastikan MySQL sudah berjalan (cek XAMPP)
- Pastikan `DATABASE_URL` di `.env` sudah benar

### Kamera tidak berfungsi di HP
- Pastikan mengakses via HTTPS (gunakan ngrok)
- Izinkan akses kamera di browser

### ngrok tidak bisa di-stop dengan Ctrl+C (Windows Git Bash)
```bash
taskkill //F //IM ngrok.exe
```

---

## 🤝 Kontribusi

Proyek ini dikembangkan sebagai bagian dari Skripsi. Tidak untuk distribusi komersial tanpa izin.

---

**© 2025 Putri Suci Renita - Disdikpora Kabupaten Lingga**