-- SQL Schema for KPI PERFORMANCE DASHBOARD UOBK RSUD AL-MULK

CREATE TABLE pilar_kpi (
  id SERIAL PRIMARY KEY,
  nama_pilar TEXT NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE indikator_kpi (
  id SERIAL PRIMARY KEY,
  pilar_id INTEGER REFERENCES pilar_kpi(id) ON DELETE CASCADE,
  nama_indikator TEXT NOT NULL,
  satuan TEXT,
  target_tahunan NUMERIC,
  keterangan TEXT
);

CREATE TABLE capaian_kpi (
  id SERIAL PRIMARY KEY,
  indikator_id INTEGER REFERENCES indikator_kpi(id) ON DELETE CASCADE,
  bulan INTEGER NOT NULL, -- 1 to 12
  tahun INTEGER NOT NULL,
  realisasi NUMERIC NOT NULL,
  persentase NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(indikator_id, bulan, tahun)
);

-- Seed Data for Pilar KPI
INSERT INTO pilar_kpi (id, nama_pilar, deskripsi) VALUES
(1, 'Pilar 1 - Ketenagakerjaan', ''),
(2, 'Pilar 2 - TLHP BPK RI', ''),
(3, 'Pilar 3 - Optimalisasi Aset', ''),
(4, 'Pilar 4 - Target PAD', ''),
(5, 'Pilar 5 - Inovasi', ''),
(6, 'Pilar 6 - IKU, Program Unggulan dan Program Prioritas Lainnya', ''),
(7, 'Pilar 7 - Anggaran', '');

-- Seed Data for Indikator KPI
INSERT INTO indikator_kpi (id, pilar_id, nama_indikator, satuan, target_tahunan, keterangan) VALUES
-- Pilar 1
(1, 1, 'Jumlah PPPKPW/THL yang dapat ditampung', 'Orang', 5, '4 Orang Perawat, 1 Orang tenaga IT'),
-- Pilar 2
(2, 2, 'Persentase penyelesaian LHP BPK', 'Persen', 100, ''),
-- Pilar 3
(3, 3, 'Pemanfaatan pengelolaan lahan parkir', 'Hektar', 0, ''),
(4, 3, 'Gedung', 'Unit', 1, 'Ruang Pertemuan'),
-- Pilar 4
(5, 4, 'Jumlah Target Pendapatan', 'Rupiah', 15000000000, ''),
-- Pilar 5
(6, 5, 'Jumlah inovasi baru dijalankan', 'Inovasi', 12, ''),
(7, 5, 'Jumlah inovasi lama yang dilanjutkan', 'Inovasi', 25, ''),
-- Pilar 6
(8, 6, 'Expose Media', 'Posting', 300, ''),
(9, 6, 'Peningkatan kompetensi layanan RS tingkat dasar', 'Kegiatan', NULL, ''),
(10, 6, 'Jumlah pelayanan vaksinasi internasional', 'Pelayanan', NULL, ''),
(11, 6, 'Expose media sosial', 'Posting', NULL, ''),
(12, 6, 'Menabung di BPR/Pinjam di BPR', 'Nasabah', 12, ''),
(13, 6, 'Beli Air Mineral PDAM', 'Dus', 100, ''),
-- Pilar 7
(14, 7, 'Belanja Pegawai', 'Rupiah', 2966500000, ''),
(15, 7, 'Belanja Operasional', 'Rupiah', 11119500000, ''),
(16, 7, 'Belanja Modal', 'Rupiah', 914000000, '');

-- Reset Sequence
SELECT setval('pilar_kpi_id_seq', (SELECT MAX(id) FROM pilar_kpi));
SELECT setval('indikator_kpi_id_seq', (SELECT MAX(id) FROM indikator_kpi));
