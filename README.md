# 🕊️ Lumen — Digital Prayer Space

> *A quiet digital sanctuary for prayer, reflection, and solidarity.*

**Lumen** adalah platform digital minimalis yang dirancang sebagai *ruang hening* bagi umat Katolik — tempat untuk berdoa, merenung, dan saling menguatkan dalam iman.

Menggabungkan spiritualitas, teknologi, dan komunitas dalam satu pengalaman yang sederhana namun bermakna.

---

## ✨ Core Features

### 📖 Pustaka Doa Lengkap
Akses cepat ke berbagai jenis doa:
- Doa harian
- Doa liturgis
- Novena  
Dirancang untuk kemudahan dan fokus tanpa distraksi.

---

### 📅 Kalender Liturgi Dinamis
- Penyesuaian warna liturgi otomatis  
- Renungan harian terintegrasi  
- Membantu pengguna tetap selaras dengan kalender Gereja  

---

### 🤍 Dinding Harapan *(Wall of Hope)*
- Ruang anonim untuk berbagi intensi doa  
- Saling mendoakan antar pengguna  
- Membangun rasa kebersamaan dan empati  

---

### 💸 Sistem Donasi Transparan
- Integrasi payment gateway  
- Mendukung kegiatan sosial dan karya kasih  
- Transparansi sebagai nilai utama  

---

## 🛠️ Tech Stack

**Frontend**
- Next.js (TypeScript)
- Tailwind CSS  

**Backend**
- Express.js  
- Drizzle ORM  

**Database**
- PostgreSQL  
- Supabase / Neon  

**Authentication**
- Google Auth (NextAuth / Clerk)

---

## 🚀 Getting Started

Ikuti langkah berikut untuk menjalankan project secara lokal:

```bash
# 1. Clone repository
git clone https://github.com/Eliasilyz/lumen.git

# 2. Masuk ke folder project
cd lumen

# 3. Install dependencies
npm install

# 4. Setup environment variables
cp .env.example .env
# lalu isi sesuai kebutuhan

# 5. Jalankan database migration
npx drizzle-kit push

# 6. Start development server
npm run dev