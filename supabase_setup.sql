-- Hapus tabel jika sudah ada (opsional, untuk clean restart)
DROP TABLE IF EXISTS capaian_kpi CASCADE;
DROP TABLE IF EXISTS indikator_kpi CASCADE;

-- Buat tabel indikator_kpi sesuai struktur terbaru (tanpa relasi ke pilar_kpi)
CREATE TABLE indikator_kpi (
    id SERIAL PRIMARY KEY,
    nomor INTEGER,
    pilar VARCHAR(255) NOT NULL,
    uraian_kpi TEXT NOT NULL,
    satuan VARCHAR(50) NOT NULL,
    target_tahunan NUMERIC NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Buat tabel capaian_kpi
CREATE TABLE capaian_kpi (
    id SERIAL PRIMARY KEY,
    indikator_id INTEGER REFERENCES indikator_kpi(id) ON DELETE CASCADE,
    tahun INTEGER NOT NULL,
    bulan INTEGER NOT NULL,
    realisasi NUMERIC NOT NULL,
    persentase NUMERIC,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(indikator_id, tahun, bulan) -- Ensure only one entry per indicator per month
);

-- Insert Data Master Indikator KPI
INSERT INTO indikator_kpi (id, nomor, pilar, uraian_kpi, satuan, target_tahunan) VALUES
(1, 1, 'PILAR 1 - KETENAGAKERJAAN', 'Jumlah PPPK/PWTHL yang dapat ditampung', 'Orang', 5),
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
(15, 15, 'PILAR 7 - ANGGARAN', 'Belanja Modal', 'Rupiah', 939000000);

-- Reset sequence id indikator_kpi
SELECT setval('indikator_kpi_id_seq', (SELECT MAX(id) FROM indikator_kpi));

-- Perintah tambahan untuk fitur Dokumen Realisasi KPI
ALTER TABLE capaian_kpi ADD COLUMN IF NOT EXISTS dokumen_url TEXT;

-- Buat bucket storage dokumen_realisasi_kpi jika menggunakan Supabase Dashboard
-- (Bisa juga dibuat manual via menu Storage di Supabase)
INSERT INTO storage.buckets (id, name, public) VALUES ('dokumen_realisasi_kpi', 'dokumen_realisasi_kpi', true) ON CONFLICT DO NOTHING;
