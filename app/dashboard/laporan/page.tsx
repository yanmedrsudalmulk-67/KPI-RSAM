"use client";

import { FileText, Download, Printer, FileOutput, FileSpreadsheet, Calendar, Search } from "lucide-react";

const laporanData = [
  { id: 1, title: "Laporan Capaian KPI Bulanan", periode: "Bulan Juli 2026", type: "Bulanan", date: "01 Aug 2026", size: "2.4 MB" },
  { id: 2, title: "Laporan Capaian KPI Bulanan", periode: "Bulan Juni 2026", type: "Bulanan", date: "01 Jul 2026", size: "2.1 MB" },
  { id: 3, title: "Laporan Evaluasi Triwulan II", periode: "Q2 (April - Juni 2026)", type: "Triwulan", date: "05 Jul 2026", size: "5.8 MB" },
  { id: 4, title: "Laporan Evaluasi Triwulan I", periode: "Q1 (Jan - Mar 2026)", type: "Triwulan", date: "05 Apr 2026", size: "5.5 MB" },
  { id: 5, title: "Laporan Tahunan KPI 2025", periode: "Tahun 2025", type: "Tahunan", date: "15 Jan 2026", size: "12.4 MB" },
];

export default function LaporanPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins text-white tracking-tight">LAPORAN KPI RSUD AL-MULK</h1>
          <p className="text-gray-400 mt-1">Unduh dan cetak laporan hasil capaian kinerja</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-purple to-primary-pink rounded-xl text-white font-medium hover:opacity-90 shadow-lg shadow-primary-purple/20 transition-all hover:scale-105">
          <FileOutput className="w-5 h-5" /> Generate Laporan Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glassmorphism border-t-4 border-t-primary-cyan flex items-start gap-4 hover:bg-white/10 transition-colors">
          <div className="p-3 rounded-lg bg-primary-cyan/20">
            <Calendar className="w-6 h-6 text-primary-cyan" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Laporan Bulanan</h3>
            <p className="text-sm text-gray-400">Rekapitulasi capaian setiap akhir bulan.</p>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl glassmorphism border-t-4 border-t-primary-gold flex items-start gap-4 hover:bg-white/10 transition-colors">
          <div className="p-3 rounded-lg bg-primary-gold/20">
            <Calendar className="w-6 h-6 text-primary-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Laporan Triwulan</h3>
            <p className="text-sm text-gray-400">Evaluasi komprehensif per kuartal.</p>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl glassmorphism border-t-4 border-t-primary-purple flex items-start gap-4 hover:bg-white/10 transition-colors">
          <div className="p-3 rounded-lg bg-primary-purple/20">
            <Calendar className="w-6 h-6 text-primary-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Laporan Tahunan</h3>
            <p className="text-sm text-gray-400">Rangkuman kinerja setahun penuh.</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl glassmorphism">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white font-poppins">Arsip Laporan</h2>
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari laporan..."
              className="pl-9 pr-4 py-2 w-full sm:w-72 bg-dark-navy border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary-purple transition-colors"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {laporanData.map((laporan) => (
            <div key={laporan.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-dark-navy/50 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all">
              <div className="flex items-start gap-4 mb-4 md:mb-0">
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 hidden sm:block">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1 flex items-center gap-2">
                    {laporan.title}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300 uppercase tracking-widest">{laporan.type}</span>
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Periode: {laporan.periode}</span>
                    <span>Tgl. Dibuat: {laporan.date}</span>
                    <span>Ukuran: {laporan.size}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-charcoal border border-white/10 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-charcoal border border-white/10 text-sm text-green-400 hover:bg-green-400/10 transition-colors">
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
                <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Print">
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
