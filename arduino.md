# Dokumentasi Integrasi Arduino

Dokumen ini menjelaskan mekanisme koneksi dan logika kerja Arduino untuk sistem IoT Smart Humidifier.

## Mekanisme Koneksi
Arduino (misalnya ESP32/ESP8266) harus terhubung ke jaringan WiFi dan berkomunikasi dengan server melalui protokol **HTTP REST API**.

Base URL Server: `http://<IP-SERVER>:3000` (Ganti dengan IP VPS atau komputer server)

## Logika Fitur Automatic Relay

Sistem relay memiliki dua mode operasi: **Otomatis** dan **Manual**.

### 1. Mode Otomatis (Default)
Pada mode ini, Arduino mengambil keputusan sendiri berdasarkan pembacaan sensor kelembapan lokal.

**Aturan Logika:**
- **AUTO OFF**: Jika kelembapan terbaca **> 55%**, relay otomatis **MATI**.
- **AUTO ON**: Jika kelembapan terbaca **< 45%**, relay otomatis **MENYALA**.

**Sinkronisasi Status:**
Setiap kali Arduino melakukan perubahan status secara otomatis (misal: menyalakan relay karena kering), Arduino **WAJIB** mengirimkan update status ke server.
- **Endpoint**: `POST /relay`
- **Body**: `{ "reported_status": "ON", "mode": "AUTO" }`

### 2. Mode Manual
Mode ini dipicu ketika pengguna melakukan kontrol via Frontend (Aplikasi/Web).

**Alur Kerja:**
1. Pengguna menekan tombol di aplikasi (Frontend mengirim request ke server).
2. Server mencatat perubahan status dan mengubah mode menjadi `MANUAL`.
3. Arduino harus melakukan pengecekan (polling) ke server secara berkala (misal setiap 5-10 detik).
4. Jika Arduino menerima data dari server bahwa `mode` adalah `MANUAL`, maka:
   - Arduino **BERHENTI** menjalankan logika otomatis (aturan 45%-55% diabaikan).
   - Arduino mengikuti status `reported_status` yang diminta oleh server (ON/OFF).

## Ringkasan Endpoint untuk Arduino

### Mengirim Data Sensor (Setiap beberapa detik/menit)
- **Suhu**: `POST /celcius`
  - Body: `{ "degrees": 28 }`
- **Kelembapan**: `POST /humidity`
  - Body: `{ "percent": 60 }`

### Melaporkan Status Relay (Saat Arduino mengubah relay sendiri)
- **Update Status**: `POST /relay`
  - Body: `{ "reported_status": "OFF", "mode": "AUTO" }`

### Menerima Perintah Manual (Polling)
- **Cek Perintah**: `GET /relay` (Ambil data terakhir)
  - Response: Cek field `mode` dan `reported_status`.
  - Jika `mode == "MANUAL"`, ikuti `reported_status` dari server.
  - Jika `mode == "AUTO"`, jalankan logika otomatis internal.
