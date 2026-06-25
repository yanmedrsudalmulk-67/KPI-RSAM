-- Jalankan script SQL ini di SQL Editor pada Supabase Dashboard Anda.

-- 1. Buat tabel 'settings' untuk menyimpan logo URL
CREATE TABLE IF NOT EXISTS public.settings (
    id int8 PRIMARY KEY,
    logo_url text,
    welcome_bg_type text DEFAULT 'default',
    welcome_bg_val text,
    menu_bg_type text DEFAULT 'default',
    menu_bg_val text
);

-- Tambahkan kolom secara dinamis jika tabel sudah ada namun belum memiliki kolom latar belakang
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS welcome_bg_type text DEFAULT 'default';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS welcome_bg_val text;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS menu_bg_type text DEFAULT 'default';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS menu_bg_val text;

-- 2. Masukkan data dummy jika tabel masih kosong
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

-- 4. Buat storage bucket bernama 'assets' jika belum ada
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Berikan akses publik penuh pada bucket 'assets'
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Public Access" 
ON storage.objects FOR ALL 
USING (bucket_id = 'assets')
WITH CHECK (bucket_id = 'assets');
