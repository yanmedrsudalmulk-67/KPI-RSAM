export const pilarKpi = [
  { id: 1, name: "PILAR 1 - KETENAGAKERJAAN", count: 1, avg: 85, color: "from-blue-500 to-blue-700", status: "Tercapai", trend: "up", progress: 85 },
  { id: 2, name: "PILAR 2 - TLHP BPK RI", count: 1, avg: 92, color: "from-green-500 to-green-700", status: "Tercapai", trend: "up", progress: 92 },
  { id: 3, name: "PILAR 3 - OPTIMALISASI ASET", count: 2, avg: 78, color: "from-yellow-400 to-orange-500", status: "Perlu perhatian", trend: "down", progress: 78 },
  { id: 4, name: "PILAR 4 - TARGET PAD", count: 1, avg: 95, color: "from-purple-500 to-purple-700", status: "Tercapai", trend: "up", progress: 95 },
  { id: 5, name: "PILAR 5 - INOVASI", count: 2, avg: 60, color: "from-red-500 to-pink-600", status: "Belum tercapai", trend: "down", progress: 60 },
  { id: 6, name: "PILAR 6 - IKU, PROGRAM UNGGULAN DAN PROGRAM PRIORITAS LAINNYA", count: 5, avg: 88, color: "from-teal-400 to-teal-600", status: "Tercapai", trend: "up", progress: 88 },
  { id: 7, name: "PILAR 7 - ANGGARAN", count: 3, avg: 81, color: "from-indigo-400 to-indigo-600", status: "Perlu perhatian", trend: "up", progress: 81 },
];

export const indicators = [
  { id: 1, pilarId: 1, name: "Jumlah PPPKPW/THL yang dapat ditampung", satuan: "Orang", target: 5, realisasi: 0, capaian: 0 },
  { id: 2, pilarId: 2, name: "Persentase Penyelesaian LHP BPK", satuan: "Persen", target: 100, realisasi: 0, capaian: 0 },
  { id: 3, pilarId: 3, name: "Jumlah aset yang dimanfaatkan - a. Pemanfaatan lahan parkir", satuan: "Hektar", target: 0.1, realisasi: 0, capaian: 0 },
  { id: 4, pilarId: 3, name: "Jumlah aset yang dimanfaatkan - b. Bangunan yang disewakan", satuan: "Unit", target: 1, realisasi: 0, capaian: 0 },
  { id: 5, pilarId: 4, name: "Jumlah Target Pendapatan", satuan: "Rupiah", target: 15000000000, realisasi: 0, capaian: 0 },
  { id: 6, pilarId: 5, name: "Jumlah inovasi baru yang dijalankan", satuan: "Inovasi", target: 12, realisasi: 0, capaian: 0 },
  { id: 7, pilarId: 5, name: "Jumlah inovasi lama yang dilanjutkan", satuan: "Inovasi", target: 25, realisasi: 0, capaian: 0 },
  { id: 8, pilarId: 6, name: "Peningkatan kompetensi layanan RS tingkat dasar", satuan: "Layanan", target: 7, realisasi: 0, capaian: 0 },
  { id: 9, pilarId: 6, name: "Jumlah pelayanan vaksinasi internasional", satuan: "Orang", target: 500, realisasi: 0, capaian: 0 },
  { id: 10, pilarId: 6, name: "Expose media sosial", satuan: "Posting", target: 288, realisasi: 0, capaian: 0 },
  { id: 11, pilarId: 6, name: "Cross selling - a. Menabung di BPR/Pinjam di BPR", satuan: "Nasabah", target: 12, realisasi: 0, capaian: 0 },
  { id: 12, pilarId: 6, name: "Cross selling - b. Beli Air Mineral PDAM", satuan: "Dus", target: 100, realisasi: 0, capaian: 0 },
  { id: 13, pilarId: 7, name: "Belanja Pegawai", satuan: "Rupiah", target: 2821500000, realisasi: 0, capaian: 0 },
  { id: 14, pilarId: 7, name: "Belanja Operasional", satuan: "Rupiah", target: 11029500000, realisasi: 0, capaian: 0 },
  { id: 15, pilarId: 7, name: "Belanja Modal", satuan: "Rupiah", target: 939000000, realisasi: 0, capaian: 0 },
];

export const chartData = [
  { name: 'Jan', target: 80, realisasi: 75 },
  { name: 'Feb', target: 85, realisasi: 80 },
  { name: 'Mar', target: 85, realisasi: 88 },
  { name: 'Apr', target: 90, realisasi: 85 },
  { name: 'May', target: 95, realisasi: 90 },
  { name: 'Jun', target: 95, realisasi: 97 },
];
