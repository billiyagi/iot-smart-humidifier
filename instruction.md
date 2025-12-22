# Panduan Menjalankan IoT Smart Humidifier API

Ikuti langkah-langkah berikut untuk menjalankan aplikasi ini pertama kali.

## Prasyarat
Pastikan Anda telah menginstal:
- [Bun](https://bun.sh/)
- Akun [Supabase](https://supabase.com/)

## 1. Setup Environment Variables
Buka file `.env` di root project dan isi kredensial Supabase Anda:

```env
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

Anda bisa mendapatkan kredensial ini di dashboard Supabase: **Project Settings > API**.

## 2. Setup Database
Aplikasi ini menggunakan Supabase CLI untuk mengelola database.

1. **Login ke Supabase CLI** (jika belum):
   ```bash
   bunx supabase login
   ```

2. **Link Project Lokal ke Remote**:
   Dapatkan `Project Ref` dari URL dashboard Supabase Anda (misal: `https://supabase.com/dashboard/project/<project-ref>`).
   ```bash
   bunx supabase link --project-ref <project-ref>
   ```
   *Masukkan password database Anda jika diminta.*

3. **Push Migrasi Database**:
   Kirim struktur tabel (Celcius, Humidity, Relay) ke database Supabase Anda:
   ```bash
   bunx supabase db push
   ```

## 3. Menjalankan Server
1. **Install Dependencies** (jika belum):
   ```bash
   bun install
   ```

2. **Jalankan Server Development**:
   ```bash
   bun run dev
   ```

Server akan berjalan di `http://localhost:3000`.

## 4. Dokumentasi API (Swagger)
Setelah server berjalan, Anda dapat melihat dokumentasi API secara visual di:
`http://localhost:3000/swagger`

## 5. Daftar API Endpoint

### Celcius (Suhu)
- `POST /celcius`: Kirim data suhu baru.
  - Body: `{ "degrees": 25 }`
- `GET /celcius`: Ambil riwayat suhu.
- `DELETE /celcius/:id`: Hapus data suhu berdasarkan ID.

### Humidity (Kelembapan)
- `POST /humidity`: Kirim data kelembapan baru.
  - Body: `{ "percent": 60 }`
- `GET /humidity`: Ambil riwayat kelembapan.
- `DELETE /humidity/:id`: Hapus data kelembapan berdasarkan ID.

### Relay (Saklar)
- `POST /relay`: Buat status relay baru.
  - Body: `{ "reported_status": "OFF", "mode": "AUTO" }`
- `GET /relay`: Ambil riwayat status relay.
- `PATCH /relay/:id`: Update status relay.
  - Body: `{ "reported_status": "ON" }`

### Statistik
- `GET /statistik`: Mendapatkan ringkasan data harian, mingguan, dan bulanan.
