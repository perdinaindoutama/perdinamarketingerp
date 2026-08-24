# AGENTS.md — PERDINA Marketing Intelligence System

Panduan untuk AI agent / developer yang bekerja di repo ini.

## Ringkasan Project

**PERDINA Marketing Intelligence System** (versi v14) — aplikasi web ERP/CRM internal
untuk **PT. Perdina Indo Utama** (distributor/fast-moving produk, bahasa UI: Indonesia).
Mencakup: dashboard penjualan, database sales/invoice/billing, CRM & lead pipeline,
aktivitas marketing harian, kalender marketing, content planning, insights, arsip dokumen,
dan integrasi akuntansi **Accurate Online**.

## Struktur File (flat, tanpa folder src)

| File | Fungsi |
|---|---|
| `index.html` | **Seluruh aplikasi** (~7.100 baris / ~430 KB). CSS inline di `<head>`, semua halaman sebagai `<div id="page-*">`, semua logika JS dalam satu blok `<script>` besar. |
| `netlify.toml` | Konfigurasi deploy Netlify: `publish = "."`, functions di `netlify/functions`. |
| `netlify/functions/accurate-proxy.js` | Netlify Function — CORS proxy dari browser ke Accurate Online API (`db-list`, `open-db`, `check-session`, `refresh-session`, `api-call`). |
| `PERDINA_MIGRATION_v5_4_crm_activity.sql` | Migrasi Postgres (Supabase) v5.4 — idempoten (`DO $$ IF NOT EXISTS $$`). Menambah kolom `lead_stage`, `last_interaction_date/type/summary` di tabel `customers`, `updated_at` di `activities`, plus index performa. |

> ⚠️ Nama `index (1).html` adalah artefak download browser. Untuk deploy Netlify,
> file harus direname menjadi `index.html`. (✅ sudah direname di repo ini.)

## Tech Stack

- **Frontend**: Vanilla JavaScript + HTML + CSS (satu file). **Tidak ada** framework, bundler, `package.json`, build step, maupun test suite.
- **Library via CDN**:
  - `@supabase/supabase-js@2` (jsdelivr)
  - `Chart.js 4.4.1` (cdnjs)
- **Backend**: Supabase (Postgres + Auth). URL & anon key tertanam di konstanta
  `SUPABASE_EMBEDDED_URL` / `SUPABASE_EMBEDDED_KEY` (index.html ~line 2015); fallback:
  Setup Wizard yang menyimpan kredensial ke `localStorage` (`sb_url`, `sb_key`).
- **Hosting**: Netlify (static + functions).
- **Integrasi**: Accurate Online (OAuth token disimpan di `localStorage`: `aol_access_token`, `aol_session_id`, dst.) melalui proxy function.

## Arsitektur Aplikasi (index.html)

- SPA tanpa router library — navigasi lewat fungsi `nav('page-id')` yang menampilkan `<div id="page-*">`.
- **Modul/halaman**: dashboard, sales-db, invoice, billing, forecast, products-master, crm, customers, clv, visits, tasks, activities, calendar, content, market-insight, customer-insight, documents, samples, accurate, activity-log (khusus admin), profile.
- **State global in-memory**: array `allCustomers`, `allSales`, `allInvoices`, `allTasks`, `allActivities`, `allVisits`, `allContentPlans`, `allHashtags`, `allMarketingPlans`, `allMarketInsights`, `allCustomerInsights`, `allFollowups` — dimuat sekali dari Supabase lalu difilter di sisi client.
- **Auth**: Supabase Auth (login/register screen). Admin ditentukan per email (`isAdmin()` / `getAdminEmail()`, ~line 2179) — mengontrol visibilitas nav "Activity Log".
- **Tabel Supabase yang dipakai**: `sales`, `products`, `customers`, `invoices`, `tasks`, `activities`, `visits`, `marketing_plans`, `content_plans`, `market_insights`, `customer_insights`, `billing_followups`, `product_samples`, `documents`, `hashtags`, `user_profiles`, `activity_log`.

## Konvensi Kode

- Semua perubahan frontend terjadi di `index.html` — ikuti gaya existing: CSS custom properties di `:root` (palet maroon/cream/navy), utilitas seperti `fmtRp()` untuk format Rupiah.
- Changelog versi ditulis sebagai komentar di `<head>` (line ~7), format: `<!-- vNN — F1:fitur; F2:fitur -->`. Naikkan versi + tulis ringkasan fitur baru di sana.
- Migrasi database: selalu idempoten (pola `DO $$ ... IF NOT EXISTS ... END$$;`), tidak menghapus data, tidak memodifikasi kolom existing. Simpan sebagai file SQL baru bernomor versi.
- Jangan pindahkan kode ke file terpisah / refactor struktur kecuali diminta eksplisit — desainnya memang single-file.

## Menjalankan & Deploy

- **Lokal**: buka `index.html` langsung di browser (butuh internet untuk CDN & Supabase). Tidak ada dev server.
- **Deploy**: push folder ke Netlify (static site). Pastikan HTML sudah direname `index.html`. Function proxy otomatis ter-deploy dari `netlify/functions/`.

## Keamanan

- Yang tertanam hanya **anon key** Supabase (publik by design, dilindungi RLS) — bukan service key. Tetap jangan commit service key / token Accurate ke repo.
- Token Accurate Online hanya tersimpan di `localStorage` client, tidak pernah melewati repo.
