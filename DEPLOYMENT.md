# PANDUAN DEPLOYMENT & SETUP MED-COMMAND
### Tactical Medical Mapping System — Firebase Project `medcommand-a178f`

Dokumentasi ini menjelaskan konfigurasi Firebase aktif untuk project **`medcommand-a178f`** (display name: **medcommand**) dan langkah deployment ke **Vercel**.

---

## 1. Konfigurasi Aktif Project `medcommand-a178f`

Aplikasi telah dikonfigurasi dengan kredensial Web App resmi:
- **Project ID:** `medcommand-a178f`
- **Auth Domain:** `medcommand-a178f.firebaseapp.com`
- **Storage Bucket:** `medcommand-a178f.firebasestorage.app`
- **Firestore Database ID:** `(default)`
- **Messaging Sender ID:** `708278279022`
- **Measurement ID:** `G-JBW3SB78NB`
- **App ID:** `1:708278279022:web:14bebf4e7e9af6a50b3f7f`

---

## 2. Pemasangan Firebase Security Rules di Console `medcommand-a178f`

Karena project `medcommand-a178f` adalah project pribadi di luar service account otomatis, Security Rules harus dipasang melalui Firebase Console:

### Firestore Security Rules
Buka [Firebase Console](https://console.firebase.google.com/) -> Pilih project **`medcommand-a178f`** -> **Firestore Database** -> tab **Rules**:
Salin seluruh isi file `firestore.rules` dari repositori ini, lalu klik **Publish**.

Aturan ini mengamankan data secara ketat:
- Hanya admin terverifikasi (terdaftar di `/admins/{uid}` atau email bootstrap `riskiramad3@gmail.com`) yang dapat membuat, mengubah, memindahkan, atau menghapus peta, unit medis, dan zona risiko.
- Petugas (Officer) hanya dapat membaca peta yang UID-nya dicantumkan pada field `allowedOfficerIds` di dokumen peta tersebut.
- Petugas dilarang keras mengubah koordinat, menambah data, atau memanipulasi role sendiri.

### Storage Security Rules
Buka **Storage** -> tab **Rules** di Firebase Console:
Salin seluruh isi file `storage.rules`, lalu klik **Publish**.
- Pengguna yang masuk dapat melihat foto kendaraan.
- Hanya Admin yang dapat mengunggah gambar kendaraan ambulans/motor medis (dibatasi tipe file JPEG/PNG/WebP dan ukuran maksimal 5 MB).

---

## 3. Pendaftaran Authorized Domains di Firebase Auth

Agar login Google dan Email tidak mengalami error `auth/unauthorized-domain`:
1. Di Firebase Console `medcommand-a178f`, buka **Authentication** -> tab **Settings** -> **Authorized domains**.
2. Klik **Add domain** dan tambahkan hostname berikut:
   - `ais-dev-6fenuqlz76eltfpkdfuj7a-187766238941.asia-east1.run.app`
   - `ais-pre-6fenuqlz76eltfpkdfuj7a-187766238941.asia-east1.run.app`
   - `localhost`
   - Domain Vercel Anda (misalnya `med-command.vercel.app` setelah dideploy)

---

## 4. Penentuan Admin Pertama (Bootstrap Admin)

Sistem telah dikonfigurasi dengan akun Admin tepercaya awal:
- **Email Admin:** `riskiramad3@gmail.com`
- Saat akun dengan email ini login pertama kali ke project `medcommand-a178f` (baik via Google Sign-In maupun Email/Password), sistem secara otomatis mencatat UID barunya ke dalam koleksi `/admins/{uid}` dan `/users/{uid}` dengan `role: 'admin'`.
- Akun lain yang mendaftar otomatis menjadi `role: 'officer'`.

---

## 5. Deployment ke Vercel

1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "feat: configure medcommand firebase project"
   git push origin main
   ```
2. **Pengaturan Environment Variables di Vercel Dashboard:**
   Tambahkan variabel berikut:
   - `VITE_FIREBASE_API_KEY`: `AIzaSyBHqRPxBRtO2-ogSy7ksOaeWBxy7Ga5WMc`
   - `VITE_FIREBASE_AUTH_DOMAIN`: `medcommand-a178f.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: `medcommand-a178f`
   - `VITE_FIREBASE_STORAGE_BUCKET`: `medcommand-a178f.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: `708278279022`
   - `VITE_FIREBASE_APP_ID`: `1:708278279022:web:14bebf4e7e9af6a50b3f7f`
   - `VITE_FIREBASE_DATABASE_ID`: `(default)`
   - `VITE_FIREBASE_MEASUREMENT_ID`: `G-JBW3SB78NB`
3. Klik **Deploy**.
