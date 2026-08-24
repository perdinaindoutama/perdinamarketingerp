# HANDOFF — PERDINA Marketing Intelligence System

## Ringkasan Singkat

**PERDINA Marketing Intelligence System** v14.2 — web app ERP/CRM internal
untuk **PT. Perdina Indo Utama** (distributor/fast-moving produk, bahasa UI: Indonesia).

---

## Tech Stack

- **Frontend**: Vanilla JavaScript + HTML + CSS (satu file `index.html` ~7.200 baris)
- **Library via CDN**: Supabase JS v2, Chart.js 4.4.1
- **Backend**: Supabase (Postgres + Auth) — kredensial di `index.html` baris 2015-2016
- **Hosting**: GitHub Pages (`perdinaindoutama.github.io/perdinamarketingerp/`)
- **Proxy**: Vercel Serverless (`perdinamarketingerp.vercel.app/api/accurate-proxy`)
- **Integrasi**: Accurate Online (OAuth + API Token)

---

## Struktur Repo

```
perdinamarketingerp/
├── index.html                    # Seluruh aplikasi (~7.200 baris)
├── api/
│   └── accurate-proxy.js         # Vercel Serverless Function (CORS proxy)
├── vercel.json                   # Vercel config
├── .env                          # Kredensial (gitignored)
├── .env.example                  # Template kredensial
├── .gitignore
├── AGENTS.md                     # Panduan untuk AI agent
├── PANDUAN_ADMIN_ACCURATE.md     # Panduan install untuk admin
└── PERDINA_MIGRATION_v5_4_crm_activity.sql  # Migrasi Supabase
```

---

## Yang Sudah Dikerjakan (Hari Ini)

1. ✅ Setup Git + GitHub repo (`perdinamarketingerp`)
2. ✅ Rename file `index (1).html` → `index.html`
3. ✅ Setup GitHub Pages deployment
4. ✅ Hapus Netlify config (tidak dipakai)
5. ✅ **Security fix XSS** — tambah `escapeHtml()`, sanitize 49 innerHTML injection points
6. ✅ **Vercel proxy** — deploy Accurate Online CORS proxy
7. ✅ **Accurate Online integration** — OAuth flow + manual sync
8. ✅ Fix session handling — auto-refresh instead of clearing state
9. ✅ Fix redirect after OAuth callback
10. ✅ Improved error handling — show install link when app not installed

---

## Yang Perlu Dikerjakan: ERROR LOGGING

### Tujuan
Buat sistem log error untuk:
1. **Frontend errors** — JavaScript errors yang terjadi di browser
2. **API errors** — error dari Supabase dan Accurate Online proxy
3. **User activity log** — tracking aksi user (sudah ada di tabel `activity_log`)

### Implementasi yang Diharapkan

**1. Global error handler** di `index.html`:
```javascript
// Tangkap semua unhandled errors
window.onerror = function(msg, url, line, col, error) {
  // Kirim ke Supabase table 'error_logs'
  db.from('error_logs').insert({
    message: msg,
    source: url,
    line: line,
    column: col,
    stack: error?.stack,
    user_agent: navigator.userAgent,
    user_email: currentUser?.email,
    page: currentPage
  });
  return false;
};

// Tangkap unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
  // ... sama, kirim ke error_logs
});
```

**2. Supabase table** `error_logs`:
```sql
CREATE TABLE error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT,
  source TEXT,
  line INTEGER,
  column INTEGER,
  stack TEXT,
  user_agent TEXT,
  user_email TEXT,
  page TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can insert
CREATE POLICY "Allow authenticated insert" ON error_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: admin can read
CREATE POLICY "Allow admin read" ON error_logs
  FOR SELECT USING (auth.role() = 'authenticated');
```

**3. Accurate Online proxy error logging** di `api/accurate-proxy.js`:
```javascript
// Log error ke console (Vercel logs)
console.error('[accurate-proxy]', err.message, { action, timestamp: new Date().toISOString() });
```

**4. Error boundary untuk Supabase calls**:
```javascript
// Wrapper function
async function safeSupabaseCall(fn, context) {
  try {
    return await fn();
  } catch (e) {
    console.error(`[Supabase Error] ${context}:`, e.message);
    // Log ke error_logs
    if (db) {
      db.from('error_logs').insert({
        message: e.message,
        source: 'supabase',
        page: currentPage,
        user_email: currentUser?.email
      });
    }
    throw e;
  }
}
```

### File yang Perlu Diubah
1. **`index.html`** — tambah global error handler + wrapper function
2. **Buat migrasi SQL** — tabel `error_logs`

---

## Kode Penting (Lokasi di index.html)

| Fungsi | Baris | Keterangan |
|---|---|---|
| `escapeHtml()` | ~2148 | XSS sanitizer |
| `accurateApi()` | ~2190 | API call ke Vercel proxy |
| `isAccurateConnected()` | ~2211 | Cek status koneksi Accurate |
| `connectToAccurateDb()` | ~2235 | Buka database Accurate |
| `checkAccurateSession()` | ~2267 | Validasi session |
| `syncAllFromAccurate()` | ~2352 | Sync SO + Customer + Produk |
| `syncSalesFromAccurate()` | ~2455 | Sync SO saja |
| `nav()` | ~2870 | Navigasi halaman |
| `initApp()` | ~6961 | Inisialisasi app |

---

## State Global

```javascript
let db = null;                    // Supabase client
let currentUser = null;           // User yang login
let allCustomers = [];            // Data customers
let allSales = [];                // Data sales
let allInvoices = [];             // Data invoices
let allTasks = [];                // Data tasks
let allActivities = [];           // Data activities
let allVisits = [];               // Data visits
let allContentPlans = [];         // Data content plans
let allHashtags = [];             // Data hashtags
let allMarketingPlans = [];       // Data marketing plans
let allMarketInsights = [];       // Data market insights
let allCustomerInsights = [];     // Data customer insights
let allFollowups = [];            // Data followups
let accurateState = {             // Accurate Online state
  accessToken, sessionId, host, dbId, dbName, lastSync
};
let currentPage = 'dashboard';    // Halaman aktif
```

---

## Cara Jalankan

- **Lokal**: buka `index.html` langsung di browser
- **Deploy**: push ke `main` → otomatis ter-deploy ke GitHub Pages

---

## Akun

- **GitHub**: `perdinaindoutama`
- **Vercel**: `masiahmas08-3660`
- **Supabase**: project `yuooxinjyuwerkytotgp`

---

## Catatan

- Semua kode frontend dalam satu file `index.html` — jangan refactor kecuali diminta
- Changelog di `<head>` baris 7: `<!-- v14.2 — ... -->`
- Migrasi SQL harus idempoten (`DO $$ IF NOT EXISTS $$`)
- Jangan commit `.env` ke repo

---

*Dibuat: 24 Agustus 2026*
*Terakhir diupdate: v14.2*
