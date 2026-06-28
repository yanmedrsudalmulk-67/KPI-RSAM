-- -----------------------------------------------------------------------------
-- SCRIPT SETUP DATABASE SUPABASE - KPI PERFORMANCE DASHBOARD
-- -----------------------------------------------------------------------------
-- Jalankan seluruh script ini di SQL Editor Supabase Dashboard Anda.
-- Script ini dirancang agar super-aman dan toleran terhadap error (tidak akan gagal 
-- jika ada isu perizinan/schema pada bagian Storage).

-- 1. HAPUS TABEL JIKA SUDAH ADA (Opsional, untuk clean reset)
DROP TABLE IF EXISTS public.capaian_kpi CASCADE;
DROP TABLE IF EXISTS public.indikator_kpi CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- 2. BUAT TABEL INDIKATOR KPI
CREATE TABLE public.indikator_kpi (
    id SERIAL PRIMARY KEY,
    nomor INTEGER,
    pilar VARCHAR(255) NOT NULL,
    uraian_kpi TEXT NOT NULL,
    satuan VARCHAR(50) NOT NULL,
    target_tahunan NUMERIC NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BUAT TABEL CAPAIAN KPI
CREATE TABLE public.capaian_kpi (
    id SERIAL PRIMARY KEY,
    indikator_id INTEGER REFERENCES public.indikator_kpi(id) ON DELETE CASCADE,
    tahun INTEGER NOT NULL,
    bulan INTEGER NOT NULL,
    target_bulanan NUMERIC DEFAULT 0,
    realisasi NUMERIC DEFAULT 0,
    persentase NUMERIC,
    status VARCHAR(50),
    dokumen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(indikator_id, tahun, bulan)
);

-- 4. BUAT TABEL SETTINGS
CREATE TABLE public.settings (
    id SERIAL PRIMARY KEY,
    logo_url TEXT,
    welcome_bg_type TEXT DEFAULT 'default',
    welcome_bg_val TEXT,
    menu_bg_type TEXT DEFAULT 'default',
    menu_bg_val TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. POPULASI DATA AWAL INDIKATOR KPI
INSERT INTO public.indikator_kpi (id, nomor, pilar, uraian_kpi, satuan, target_tahunan) VALUES
(1, 1, 'PILAR 1 - KETENAGAKERJAAN', 'Jumlah PPPKPW/THL yang dapat ditampung', 'Orang', 5),
(2, 2, 'PILAR 2 - TLHP BPK RI', 'Persentase Penyelesaian LHP BPK', 'Persen', 100),
(3, 3, 'PILAR 3 - OPTIMALISASI ASET', 'Jumlah aset yang dimanfaatkan - a. Pemanfaatan lahan parkir', 'Hektar', 0.1),
(4, 4, 'PILAR 3 - OPTIMALISASI ASET', 'Jumlah aset yang dimanfaatkan - b. Bangunan yang disewakan', 'Unit', 1),
(5, 5, 'PILAR 4 - TARGET PAD', 'Jumlah Target Pendapatan', 'Rupiah', 15000000000),
(6, 6, 'PILAR 5 - INOVASI', 'Jumlah inovasi baru yang dijalankan', 'Inovasi', 12),
(7, 7, 'PILAR 5 - INOVASI', 'Jumlah inovasi lama yang dilanjutkan', 'Inovasi', 25),
(8, 8, 'PILAR 6 - IKU, PROGRAM UNGGULAN DAN PROGRAM PRIORITAS LAINNYA', 'Peningkatan kompetensi layanan RS tingkat dasar', 'Layanan', 7),
(9, 9, 'PILAR 6 - IKU, PROGRAM UNGGULAN DAN PROGRAM PRIORITAS LAINNYA', 'Jumlah pelayanan vaksinasi internasional', 'Orang', 500),
(10, 10, 'PILAR 6 - IKU, PROGRAM UNGGULAN DAN PROGRAM PRIORITAS LAINNYA', 'Expose media sosial', 'Posting', 288),
(11, 11, 'PILAR 6 - IKU, PROGRAM UNGGULAN DAN PROGRAM PRIORITAS LAINNYA', 'Cross selling - a. Menabung di BPR/Pinjam di BPR', 'Nasabah', 12),
(12, 12, 'PILAR 6 - IKU, PROGRAM UNGGULAN DAN PROGRAM PRIORITAS LAINNYA', 'Cross selling - b. Beli Air Mineral PDAM', 'Dus', 100),
(13, 13, 'PILAR 7 - ANGGARAN', 'Belanja Pegawai', 'Rupiah', 2821500000),
(14, 14, 'PILAR 7 - ANGGARAN', 'Belanja Operasional', 'Rupiah', 11029500000),
(15, 15, 'PILAR 7 - ANGGARAN', 'Belanja Modal', 'Rupiah', 939000000)
ON CONFLICT (id) DO UPDATE SET
    nomor = EXCLUDED.nomor,
    pilar = EXCLUDED.pilar,
    uraian_kpi = EXCLUDED.uraian_kpi,
    satuan = EXCLUDED.satuan,
    target_tahunan = EXCLUDED.target_tahunan;

-- Reset sequence id untuk tabel indikator_kpi
SELECT setval('public.indikator_kpi_id_seq', (SELECT MAX(id) FROM public.indikator_kpi));

-- POPULASI DATA AWAL SETTINGS
INSERT INTO public.settings (id, logo_url, welcome_bg_type, welcome_bg_val, menu_bg_type, menu_bg_val)
VALUES (1, '', 'default', '', 'default', '')
ON CONFLICT (id) DO NOTHING;

-- 6. KONFIGURASI ROW LEVEL SECURITY (RLS) & POLICY AKSES PUBLIK (Sangat Penting!)
-- Mengaktifkan RLS dan membuat policy agar aplikasi web (menggunakan anon key) 
-- dapat membaca dan menulis data ke tabel-tabel ini tanpa terblokir.

-- RLS untuk indikator_kpi
ALTER TABLE public.indikator_kpi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read indikator_kpi" ON public.indikator_kpi;
DROP POLICY IF EXISTS "Allow public write/all indikator_kpi" ON public.indikator_kpi;

CREATE POLICY "Allow public read indikator_kpi" ON public.indikator_kpi FOR SELECT USING (true);
CREATE POLICY "Allow public write/all indikator_kpi" ON public.indikator_kpi FOR ALL USING (true) WITH CHECK (true);

-- RLS untuk capaian_kpi
ALTER TABLE public.capaian_kpi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read capaian_kpi" ON public.capaian_kpi;
DROP POLICY IF EXISTS "Allow public write/all capaian_kpi" ON public.capaian_kpi;

CREATE POLICY "Allow public read capaian_kpi" ON public.capaian_kpi FOR SELECT USING (true);
CREATE POLICY "Allow public write/all capaian_kpi" ON public.capaian_kpi FOR ALL USING (true) WITH CHECK (true);

-- RLS untuk settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public write/all settings" ON public.settings;

CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public write/all settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);


-- 7. SETUP STORAGE BUCKETS DAN POLICIES (Menggunakan Block DO agar tidak crash jika terjadi error hak akses)
-- Supabase seringkali membatasi manipulasi langsung pada schema 'storage' melalui SQL Editor 
-- untuk role non-superuser. Dengan membungkus perintah ini dalam block DO, jika terjadi error perizinan, 
-- tabel utama tetap akan berhasil dibuat sempurna dan tidak membatalkan keseluruhan transaksi SQL.

-- Buat bucket 'assets'
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('assets', 'assets', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Notice: Gagal membuat bucket storage "assets". Silakan buat secara manual di menu Storage Supabase jika diperlukan. Error: %', SQLERRM;
END $$;

-- Buat bucket 'dokumen_realisasi_kpi'
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('dokumen_realisasi_kpi', 'dokumen_realisasi_kpi', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Notice: Gagal membuat bucket storage "dokumen_realisasi_kpi". Silakan buat secara manual di menu Storage Supabase jika diperlukan. Error: %', SQLERRM;
END $$;

-- Atur Kebijakan Akses Storage Objects (Public Access) untuk bucket assets
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access Assets" ON storage.objects;
    CREATE POLICY "Public Access Assets" 
    ON storage.objects FOR ALL 
    USING (bucket_id = 'assets')
    WITH CHECK (bucket_id = 'assets');
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Notice: Gagal membuat policy untuk bucket storage "assets": %', SQLERRM;
END $$;

-- Atur Kebijakan Akses Storage Objects (Public Access) untuk bucket dokumen_realisasi_kpi
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access Dokumen Realisasi" ON storage.objects;
    CREATE POLICY "Public Access Dokumen Realisasi" 
    ON storage.objects FOR ALL 
    USING (bucket_id = 'dokumen_realisasi_kpi')
    WITH CHECK (bucket_id = 'dokumen_realisasi_kpi');
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Notice: Gagal membuat policy untuk bucket storage "dokumen_realisasi_kpi": %', SQLERRM;
END $$;

-- 8. BUAT TABEL DASHBOARD SUMMARY
CREATE TABLE IF NOT EXISTS public.dashboard_summary (
    id SERIAL PRIMARY KEY,
    tahun INTEGER NOT NULL,
    periode VARCHAR(100) NOT NULL,
    summary_text TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tahun, periode)
);

-- Atur RLS untuk dashboard_summary
ALTER TABLE public.dashboard_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read dashboard_summary" ON public.dashboard_summary;
DROP POLICY IF EXISTS "Allow public write/all dashboard_summary" ON public.dashboard_summary;

CREATE POLICY "Allow public read dashboard_summary" ON public.dashboard_summary FOR SELECT USING (true);
CREATE POLICY "Allow public write/all dashboard_summary" ON public.dashboard_summary FOR ALL USING (true) WITH CHECK (true);
