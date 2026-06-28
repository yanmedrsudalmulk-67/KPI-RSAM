-- -----------------------------------------------------------------------------
-- SCRIPT SETUP TAMBAHAN/ALTERASI SUPABASE - SETTINGS & STORAGE
-- -----------------------------------------------------------------------------
-- Jalankan script ini di SQL Editor pada Supabase Dashboard Anda.

-- 1. Buat tabel 'settings' untuk menyimpan logo URL & konfigurasi latar belakang
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    logo_url TEXT,
    welcome_bg_type TEXT DEFAULT 'default',
    welcome_bg_val TEXT,
    menu_bg_type TEXT DEFAULT 'default',
    menu_bg_val TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tambahkan kolom secara dinamis jika tabel sudah ada namun belum memiliki kolom latar belakang terbaru
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS welcome_bg_type text DEFAULT 'default';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS welcome_bg_val text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS menu_bg_type text DEFAULT 'default';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS menu_bg_val text;

-- 2. Masukkan data awal jika tabel settings masih kosong
INSERT INTO public.settings (id, logo_url, welcome_bg_type, welcome_bg_val, menu_bg_type, menu_bg_val) 
VALUES (1, null, 'default', '', 'default', '')
ON CONFLICT (id) DO NOTHING;

-- 3. Atur Row Level Security (RLS) untuk tabel 'settings'
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public upsert settings" ON public.settings;

CREATE POLICY "Allow public read settings" 
ON public.settings FOR SELECT 
USING (true);

CREATE POLICY "Allow public upsert settings" 
ON public.settings FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Buat storage bucket 'assets' secara aman (menggunakan Block DO agar tidak crash jika terjadi isu hak akses)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('assets', 'assets', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Notice: Gagal membuat bucket storage "assets". Silakan buat secara manual di menu Storage Supabase jika diperlukan. Error: %', SQLERRM;
END $$;

-- 5. Berikan akses publik penuh pada bucket 'assets' secara aman
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    CREATE POLICY "Public Access" 
    ON storage.objects FOR ALL 
    USING (bucket_id = 'assets')
    WITH CHECK (bucket_id = 'assets');
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Notice: Gagal membuat policy "Public Access" untuk bucket storage "assets": %', SQLERRM;
END $$;

-- 6. BUAT TABEL DASHBOARD SUMMARY
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
