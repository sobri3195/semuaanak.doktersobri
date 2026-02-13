# Growth Insights Admin

Single-page web application untuk analisis pertumbuhan dan status gizi anak berdasarkan standar WHO/CDC. Aplikasi ini menghitung z-scores, percentiles, dan memberikan interpretasi status gizi untuk anak usia 0-120 bulan.

## 🚀 Fitur Utama

- **Analisis Lengkap Pertumbuhan Anak**
  - Tinggi badan menurut umur (Height-for-Age)
  - Berat badan menurut umur (Weight-for-Age)
  - Berat badan terhadap panjang badan (Weight-for-Length) untuk usia ≤24 bulan
  - Indeks massa tubuh menurut umur (BMI-for-Age) untuk usia >24 bulan

- **Output Perhitungan**
  - Z-score dengan presisi tinggi menggunakan metode WHO LMS
  - Percentile berdasarkan distribusi normal
  - Perbandingan dengan median (z=0)
  - Klasifikasi status gizi dalam Bahasa Indonesia
  - Visualisasi posisi pasien terhadap distribusi normal

- **Antarmuka Modern**
  - Sidebar navigasi yang responsif
  - Desain bersih dan profesional
  - Real-time validation input
  - Visualisasi canvas yang interaktif

## 🛠️ Teknologi

- **React 18** (UMD build) - UI framework
- **Babel Standalone** - Transpilation in-browser
- **Vanilla CSS** - Styling tanpa framework
- **Canvas API** - Visualisasi data
- **JSON** - Data storage (local, no backend)

## 📦 Struktur Proyek

```
growth-insights-admin/
├── index.html              # Entry point aplikasi
├── app.jsx                 # React application logic
├── main.js                 # Legacy jQuery implementation
├── canvas.js               # Canvas visualization helper
├── data_extended.json      # Data referensi WHO/CDC dengan LMS
├── data.json               # Data referensi sederhana
├── generate_data_json.py   # Script untuk generate data.json
├── vercel.json             # Konfigurasi Vercel deploy
├── README.md               # Dokumentasi proyek
└── tables/                 # File referensi WHO/CDC (TXT/CSV)
```

## 🚀 Cara Penggunaan

### Lokal Development

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd growth-insights-admin
   ```

2. **Jalankan web server lokal**
   
   Cara termudah adalah menggunakan Python:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   Atau menggunakan Node.js:
   ```bash
   npx serve .
   ```

3. **Buka browser**
   ```
   http://localhost:8000
   ```

### Deploy ke Vercel

1. **Install Vercel CLI** (opsional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```
   
   Atau push ke GitHub dan connect repository ke Vercel dashboard.

3. **Vercel akan otomatis mendeteksi** ini sebagai situs statis dan men-deploy.

## 📊 Cara Kerja Aplikasi

### Input Data

1. **Jenis Kelamin**: Laki-laki atau Perempuan
2. **Umur**: 0-120 bulan (dengan tampilan tahun untuk kelipatan 12)
3. **Berat Badan**: Dalam kilogram (kg)
4. **Tinggi Badan**: Dalam sentimeter (cm)

### Perhitungan Z-Score

Aplikasi menggunakan metode WHO LMS (Lambda-Mu-Sigma) untuk menghitung z-score:

```
Jika L ≈ 0:  Z = ln(value/M) / S
Jika L ≠ 0:  Z = [(value/M)^L - 1] / (L × S)
```

Dimana:
- L = Lambda (skewness parameter)
- M = Mu (median)
- S = Sigma (coefficient of variation)

### Klasifikasi Status Gizi

#### Tinggi Badan menurut Umur (Stunting)
- Z < -3: Sangat pendek (severe stunting)
- -3 ≤ Z < -2: Pendek (stunting)
- -2 ≤ Z ≤ 2: Normal
- 2 < Z ≤ 3: Tinggi
- Z > 3: Sangat tinggi

#### Berat Badan menurut Umur (Underweight)
- Z < -3: Sangat kurus (severely underweight)
- -3 ≤ Z < -2: Kurus (underweight)
- -2 ≤ Z ≤ 2: Normal
- 2 < Z ≤ 3: Berat badan di atas normal
- Z > 3: Berat badan sangat tinggi

#### BMI menurut Umur
- Z < -3: Sangat kurus (severe thinness)
- -3 ≤ Z < -2: Kurus (thinness)
- -2 ≤ Z ≤ 1: Normal
- 1 < Z ≤ 2: Risiko overweight
- 2 < Z ≤ 3: Overweight
- Z > 3: Obesitas

## 🎨 Customization

### Mengubah Warna Tema

Edit CSS di `index.html` bagian `:root` variables:

```css
:root {
  /* Warna primary */
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  
  /* Warna background */
  --bg-dark: #0f172a;
  --bg-light: #f8fafc;
  
  /* Warna teks */
  --text-primary: #0f172a;
  --text-secondary: #475569;
}
```

### Mengubah Data Referensi

File `data_extended.json` berisi data LMS WHO/CDC. Untuk mengubah data:

1. Persiapkan data LMS dalam format yang sesuai
2. Generate menggunakan `generate_data_json.py` dari folder `tables/`
3. Update `data_extended.json`
4. Refresh aplikasi

## 🔒 Keamanan

- **No Backend**: Semua data diproses di browser, tidak ada data yang dikirim ke server
- **CORS Headers**: Konfigurasi di `vercel.json` untuk keamanan tambahan
- **Content Security**: X-Content-Type-Options, X-Frame-Options, dan X-XSS-Protection enabled

## 📝 Catatan Penting

- Aplikasi ini menggunakan data referensi WHO/CDC standar untuk pertumbuhan anak
- Hasil perhitungan adalah estimasi dan tidak menggantikan konsultasi medis profesional
- Data disimpan lokal di browser, tidak ada persistence ke server
- Validasi input dilakukan sebelum perhitungan untuk mencegah error

## 🤝 Kontribusi

Untuk kontribusi atau issue reporting, silakan:
1. Fork repository
2. Buat branch baru (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

## 📄 Lisensi

Proyek ini menggunakan standar WHO/CDC yang tersedia untuk penggunaan umum dalam konteks kesehatan.

## 🔗 Referensi

- [WHO Child Growth Standards](https://www.who.int/tools/child-growth-standards)
- [CDC Growth Charts](https://www.cdc.gov/growthcharts/)
- [LMS Method Documentation](https://www.who.int/childgrowth/standards/technical_report/en/)

## 📞 Kontak

Untuk pertanyaan atau dukungan, silakan buka issue di repository.

---

Dibuat dengan ❤️ untuk mendukung kesehatan anak Indonesia
