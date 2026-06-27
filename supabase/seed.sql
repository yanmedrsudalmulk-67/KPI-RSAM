CREATE TABLE pilar_kpi (
    id SERIAL PRIMARY KEY,
    nama_pilar VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE indikator_kpi (
    id SERIAL PRIMARY KEY,
    pilar_id INTEGER REFERENCES pilar_kpi(id) ON DELETE CASCADE,
    nama_indikator VARCHAR(255) NOT NULL,
    satuan VARCHAR(50) NOT NULL,
    target_tahunan NUMERIC NOT NULL,
    keterangan TEXT
);

CREATE TABLE capaian_kpi (
    id SERIAL PRIMARY KEY,
    indikator_id INTEGER REFERENCES indikator_kpi(id) ON DELETE CASCADE,
    bulan INTEGER NOT NULL CHECK (bulan >= 1 AND bulan <= 12),
    tahun INTEGER NOT NULL,
    realisasi NUMERIC NOT NULL,
    persentase NUMERIC,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(indikator_id, bulan, tahun)
);

-- Seed Data
INSERT INTO pilar_kpi (id, nama_pilar, deskripsi) VALUES
(1, 'Ketenagakerjaan', 'Pilar 1 - Ketenagakerjaan'),
(2, 'TLHP BPK RI', 'Pilar 2 - TLHP BPK RI'),
(3, 'Optimalisasi Aset', 'Pilar 3 - Optimalisasi Aset'),
(4, 'Target PAD', 'Pilar 4 - Target PAD'),
(5, 'Inovasi', 'Pilar 5 - Inovasi'),
(6, 'IKU, Program Unggulan dan Program Prioritas Lainnya', 'Pilar 6 - IKU'),
(7, 'Anggaran', 'Pilar 7 - Anggaran');

INSERT INTO indikator_kpi (pilar_id, nama_indikator, satuan, target_tahunan, keterangan) VALUES
-- Pilar 1
(1, 'Jumlah PPPK/PW yang dapat ditampung', 'Orang', 5, '4 Orang Perawat, 1 Orang tenaga IT'),
-- Pilar 2
(2, 'Persentase penyelesaian LHP BPK', 'Persen', 100, ''),
-- Pilar 3
(3, 'Pemanfaatan pengelolaan lahan parkir', 'Hektar', 0, ''),
(3, 'Gedung', 'Unit', 1, 'Ruang Pertemuan'),
-- Pilar 4
(4, 'Jumlah Target Pendapatan', 'Rupiah', 15000000000, ''),
-- Pilar 5
(5, 'Jumlah inovasi baru dijalankan', 'Inovasi', 12, ''),
(5, 'Jumlah inovasi lama yang dilanjutkan', 'Inovasi', 25, ''),
-- Pilar 6
(6, 'Expose Media', 'Posting', 300, ''),
(6, 'Peningkatan kompetensi layanan RS tingkat dasar', 'Unit', 0, ''),
(6, 'Jumlah pelayanan vaksinasi internasional', 'Pasien', 0, ''),
(6, 'Expose media sosial', 'Posting', 0, ''),
(6, 'Menabung di BPR/Pinjam di BPR', 'Nasabah', 12, ''),
(6, 'Beli Air Mineral PDAM', 'Dus', 100, ''),
-- Pilar 7
(7, 'Belanja Pegawai', 'Rupiah', 2966500000, ''),
(7, 'Belanja Operasional', 'Rupiah', 11119500000, ''),
(7, 'Belanja Modal', 'Rupiah', 914000000, '');
