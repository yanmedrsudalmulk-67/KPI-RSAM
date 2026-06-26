"use client";

import React, { useEffect, useState, useMemo } from "react";
import { pilarKpi, indicators as indKpi } from "@/lib/data";
import {
  Save,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Target,
  Trash2,
  Filter,
  Activity,
  Upload,
  FileText,
} from "lucide-react";
import {
  getIndicatorsWithCapaianByYear,
  saveCapaian,
  uploadDokumenRealisasi,
} from "@/lib/services/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const formatIndicatorName = (name: string) => {
  if (!name) return null;
  if (name.includes("Jumlah aset yang dimanfaatkan - ")) {
    const parts = name.split(" - ");
    return (
      <div className="flex flex-col">
        <span className="text-gray-400 text-xs font-medium">Jumlah aset yang dimanfaatkan :</span>
        <span className="text-white font-semibold text-sm leading-snug mt-0.5">{parts[1]}</span>
      </div>
    );
  }
  if (name.includes("Cross selling - ")) {
    const parts = name.split(" - ");
    return (
      <div className="flex flex-col">
        <span className="text-gray-400 text-xs font-medium">Cross selling :</span>
        <span className="text-white font-semibold text-sm leading-snug mt-0.5">{parts[1]}</span>
      </div>
    );
  }
  return <span className="text-white font-semibold text-sm leading-normal">{name}</span>;
};

export default function LaporanRealisasiPage() {
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [bulan, setBulan] = useState<number>(new Date().getMonth() + 1);
  const [selectedPilarFilter, setSelectedPilarFilter] =
    useState<string>("Semua Pilar");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedIndikator, setSelectedIndikator] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputRealisasi, setInputRealisasi] = useState<string>("");
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [dokumenUrl, setDokumenUrl] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMode, setSuccessMode] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    loadData(tahun);
  }, [tahun]);

  async function loadData(selectedTahun: number) {
    setLoading(true);
    try {
      let fetchedData: any[] = [];
      let useMock = !isSupabaseConfigured();

      if (isSupabaseConfigured()) {
        try {
          fetchedData = await getIndicatorsWithCapaianByYear(selectedTahun);
          if (!fetchedData || fetchedData.length === 0) {
            useMock = true;
          }
        } catch (e) {
          console.error("DB Error", e);
          useMock = true;
        }
      }

      if (useMock) {
        // Build mock data for UI showcase
        const mockData = indKpi.map((i) => ({
          ...i,
          nama_pilar: pilarKpi.find((p) => p.id === i.pilarId)?.name || "",
          nama_indikator: i.name,
          target_tahunan: i.target,
          capaians: [],
        }));
        setData(mockData);
      } else {
        setData(fetchedData);
      }
    } catch (error) {
      console.error("Error loading data", error);
    } finally {
      setLoading(false);
    }
  }

  // Helper functions for formatting based on Satuan
  const formatValue = (value: string, satuan: string) => {
    if (!value) return "";
    const s = (satuan || "").toLowerCase();

    if (s.includes("rupiah") || s.includes("rp")) {
      let numStr = value.replace(/[^0-9]/g, "");
      if (numStr) {
        return "Rp" + parseInt(numStr, 10).toLocaleString("id-ID");
      }
      return "";
    } else if (s.includes("persen") || s.includes("%")) {
      let numStr = value.replace(/[^0-9.]/g, "");
      if (numStr) {
        if (parseFloat(numStr) > 100) numStr = "100";
        if (value.endsWith('.') && !numStr.includes('.')) return numStr + ".%";
        return numStr + "%";
      }
      return "";
    } else if (s.includes("orang") || s.includes("inovasi") || s.includes("posting")) {
      return value.replace(/[^0-9]/g, "");
    } else {
      let numStr = value.replace(/[^0-9.]/g, "");
      const parts = numStr.split('.');
      if (parts.length > 2) {
        numStr = parts[0] + '.' + parts.slice(1).join('');
      }
      return numStr;
    }
  };

  const parseRawValue = (value: string): number => {
    if (!value) return 0;
    let cleaned = value.replace(/Rp/g, '').replace(/%/g, '').trim();
    if (value.includes("Rp")) {
      cleaned = cleaned.replace(/\./g, '');
    }
    const rs = parseFloat(cleaned);
    return isNaN(rs) ? 0 : rs;
  };

  const handleOpenModal = (ind: any) => {
    setSelectedIndikator(ind);

    // Find if capaian already exists for selected bulan/tahun
    const existingCapaian = ind.capaians?.find(
      (c: any) => c.bulan === bulan && c.tahun === tahun,
    );

    if (existingCapaian) {
      setHasExistingData(true);
      setInputRealisasi(formatValue(existingCapaian.realisasi.toString(), ind.satuan || ""));
      setDokumenUrl(existingCapaian.dokumen_url || "");
    } else {
      setHasExistingData(false);
      setInputRealisasi("");
      setDokumenUrl("");
    }
    setInputFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedIndikator || !inputRealisasi) {
      alert("Nilai realisasi wajib diisi");
      return;
    }
    setIsSaving(true);

    try {
      const validValue = parseRawValue(inputRealisasi);

      const currentCapaian = selectedIndikator.capaians?.find(
        (c: any) => c.bulan === bulan && c.tahun === tahun,
      );

      const targetBulanan = currentCapaian?.target_bulanan !== undefined
        ? Number(currentCapaian.target_bulanan)
        : (selectedIndikator.target_tahunan > 0 ? selectedIndikator.target_tahunan / 12 : 0);

      let pct = 0;
      if (targetBulanan > 0) {
        pct = (validValue / targetBulanan) * 100;
      }

      let status = "Belum tercapai";
      if (pct >= 100) status = "Tercapai";
      else if (pct >= 80) status = "Perlu perhatian";

      let finalDokumenUrl = dokumenUrl;

      if (isSupabaseConfigured() && inputFile) {
        finalDokumenUrl = await uploadDokumenRealisasi(inputFile);
      }

      const payload = {
        indikator_id: selectedIndikator.id,
        bulan: bulan,
        tahun: tahun,
        target_bulanan: targetBulanan,
        realisasi: validValue,
        persentase: pct,
        status: status,
        dokumen_url: finalDokumenUrl,
      };

      if (isSupabaseConfigured()) {
        await saveCapaian(payload);
        await loadData(tahun);
      } else {
        await new Promise((r) => setTimeout(r, 800)); // mock delay
      }

      setIsModalOpen(false);
      showSuccessNotif();
    } catch (e: any) {
      if (e.message?.includes("target_bulanan") && e.message?.includes("column")) {
        alert("PENTING: Database Anda perlu diperbarui. Kolom 'target_bulanan' tidak ditemukan. Silakan jalankan script SQL terbaru di Supabase SQL Editor Anda.");
      } else {
        alert("Gagal menyimpan data: " + e.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIndikator || !hasExistingData) return;

    if (
      !confirm(
        `Hapus data realisasi untuk bulan ${MONTHS[bulan - 1]} ${tahun}?`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase!.from("capaian_kpi").delete().match({
          indikator_id: selectedIndikator.id,
          bulan: bulan,
          tahun: tahun,
        });
        await loadData(tahun);
      }
      setIsModalOpen(false);
      showSuccessNotif();
    } catch (e: any) {
      alert("Gagal menghapus data: " + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const showSuccessNotif = () => {
    setSuccessMode(true);
    setTimeout(() => setSuccessMode(false), 3000);
  };

  // Extract unique pilars for filter
  const allPilars = useMemo(() => {
    const pilars = new Set<string>();
    data.forEach((ind) => {
      const pName = ind.nama_pilar || `PILAR ${ind.pilar_id || ind.pilarId}`;
      pilars.add(pName);
    });
    return Array.from(pilars).sort();
  }, [data]);

  // Group by pilar & apply filter
  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {};
    data.forEach((ind) => {
      const pName = ind.nama_pilar || `PILAR ${ind.pilar_id || ind.pilarId}`;

      // Apply Filter
      if (
        selectedPilarFilter !== "Semua Pilar" &&
        pName !== selectedPilarFilter
      ) {
        return;
      }

      if (!groups[pName]) groups[pName] = [];
      groups[pName].push(ind);
    });
    return groups;
  }, [data, selectedPilarFilter]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto font-poppins">
      {/* HEADER SECTION */}
      <div className="text-center bg-gradient-to-br from-dark-navy/80 to-[#0F172A]/80 border border-white/5 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-primary-purple to-primary-pink"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-purple/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <h1 className="text-2xl md:text-4xl font-extrabold font-poppins bg-gradient-to-r from-blue-400 via-primary-purple to-primary-pink bg-clip-text text-transparent tracking-tight relative z-10 leading-tight">
          INPUT REALISASI
          <br />
          KEY PERFORMANCE INDICATOR (KPI)
        </h1>
        <h2 className="text-lg md:text-xl font-bold text-white mt-2 relative z-10">
          UOBK RSUD AL-MULK KOTA SUKABUMI
        </h2>
        <h3 className="text-sm md:text-base font-medium text-gray-400 mt-2 relative z-10">
          Input capaian KPI berdasarkan periode bulanan
        </h3>
      </div>

      {/* FILTER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-[#131B2A]/80 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Calendar className="w-5 h-5 text-primary-cyan" />
          <span className="text-sm font-medium text-gray-300">
            Filter Periode & Data:
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <select
              value={selectedPilarFilter}
              onChange={(e) => setSelectedPilarFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-purple focus:ring-1 focus:ring-primary-purple transition-all appearance-none cursor-pointer text-sm"
            >
              <option value="Semua Pilar" className="bg-dark-navy">
                Semua Pilar
              </option>
              {allPilars.map((p, idx) => (
                <option key={idx} value={p} className="bg-dark-navy">
                  {p}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <Filter className="w-4 h-4" />
            </div>
          </div>

          <div className="relative w-full sm:w-48">
            <select
              value={bulan}
              onChange={(e) => setBulan(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-purple focus:ring-1 focus:ring-primary-purple transition-all appearance-none cursor-pointer text-sm"
            >
              {MONTHS.map((m, idx) => (
                <option key={idx} value={idx + 1} className="bg-dark-navy">
                  {m}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </div>
          </div>

          <div className="relative w-full sm:w-32">
            <select
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-purple focus:ring-1 focus:ring-primary-purple transition-all appearance-none cursor-pointer text-sm"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-dark-navy">
                  {y}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ▼
            </div>
          </div>
        </div>
      </div>

      {successMode && (
        <div className="bg-primary-green/10 border border-primary-green/30 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="w-6 h-6 text-primary-green drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <p className="text-primary-green font-medium">
            Data realisasi KPI berhasil disimpan dan otomatis memperbarui
            Dashboard.
          </p>
        </div>
      )}

      {/* CARDS LISTING */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full border-4 border-primary-purple opacity-20 border-t-primary-purple animate-spin" />
          <span className="text-gray-400 font-medium">Memuat data KPI...</span>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedData).map(([pilarName, inds]) => (
            <div key={pilarName} className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-3 pl-2 uppercase font-poppins">
                <div className="w-2 h-8 bg-gradient-to-b from-primary-cyan to-blue-500 rounded-full"></div>
                {pilarName}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {inds.map((ind) => {
                  // Find current month's capaian
                  const currentCapaian = ind.capaians?.find(
                    (c: any) => c.bulan === bulan && c.tahun === tahun,
                  );
                  const isInputted = !!currentCapaian;

                  // Calculate target bulanan
                  const targetTahunan = Number(ind.target_tahunan || 0);
                  const targetBulanan =
                    currentCapaian?.target_bulanan !== undefined
                      ? Number(currentCapaian.target_bulanan)
                      : (targetTahunan > 0 ? targetTahunan / 12 : 0);

                  // Realisasi value
                  const realisasiVal = isInputted
                    ? Number(currentCapaian.realisasi)
                    : 0;

                  // Calculate persentase to show status
                  let pct =
                    targetBulanan > 0
                      ? (realisasiVal / targetBulanan) * 100
                      : 0;

                  let statusStr = "Belum Input";
                  let statusColor =
                    "text-gray-400 bg-gray-500/10 border-gray-500/20";

                  if (isInputted) {
                    if (
                      pct >= 100 ||
                      (targetBulanan > 0 && realisasiVal >= targetBulanan)
                    ) {
                      statusStr = "Tercapai";
                      statusColor =
                        "text-primary-green bg-primary-green/10 border-primary-green/20";
                    } else if (
                      targetBulanan > 0 &&
                      realisasiVal >= targetBulanan * 0.8
                    ) {
                      statusStr = "Perlu Perhatian";
                      statusColor =
                        "text-primary-gold bg-primary-gold/10 border-primary-gold/20";
                    } else {
                      statusStr = "Belum Tercapai";
                      statusColor =
                        "text-primary-pink bg-primary-pink/10 border-primary-pink/20";
                    }
                  }

                  return (
                    <div
                      key={ind.id}
                      className="bg-[#131B2A]/60 rounded-2xl border border-white/5 overflow-hidden hover:border-white/20 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.1)] group relative"
                    >
                      {/* Gradient Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-purple/5 to-primary-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                            <Activity className="w-5 h-5 text-blue-400" />
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border ${statusColor} backdrop-blur-sm`}
                          >
                            {statusStr}
                          </span>
                        </div>

                        <p className="text-xs text-primary-cyan font-semibold mb-1 uppercase tracking-wider">
                          {pilarName}
                        </p>
                        <div className="mb-1 min-h-[48px] flex items-center">
                          {formatIndicatorName(ind.nama_indikator || ind.name)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-5 mb-5">
                          <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                            <p className="text-[11px] text-gray-400 mb-1 uppercase font-semibold text-center">
                              Target Tahunan
                            </p>
                            <p className="text-white font-mono font-medium text-center">
                              {targetTahunan.toLocaleString("id-ID")}{" "}
                              <span className="text-[10px] text-gray-500 font-sans">
                                {ind.satuan}
                              </span>
                            </p>
                          </div>
                          <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                            <p className="text-[11px] text-gray-400 mb-1 uppercase font-semibold text-center">
                              Target Bulanan
                            </p>
                            <p className="text-gray-200 font-mono font-medium text-center">
                              {targetBulanan.toLocaleString("id-ID", {
                                maximumFractionDigits: 1,
                              })}{" "}
                              <span className="text-[10px] text-gray-500 font-sans">
                                {ind.satuan}
                              </span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenModal(ind)}
                          className="w-full py-2.5 rounded-xl border border-transparent text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                        >
                          <Edit3 className="w-4 h-4" />
                          Input Realisasi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INPUT MODAL */}
      {isModalOpen && selectedIndikator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="relative bg-[#131B2A] border border-white/10 w-full max-w-lg max-h-[calc(100vh-1rem)] sm:max-h-[90vh] flex flex-col rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1A233A] to-[#131B2A] p-5 sm:p-6 border-b border-white/10 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Input Realisasi
                </h2>
                <p className="text-sm text-primary-cyan font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Periode: {MONTHS[bulan - 1]} {tahun}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
              {/* Indikator Info */}
              <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                <div>
                  <p className="text-[11px] text-gray-400 mb-1 uppercase font-semibold">
                    Nama Pilar
                  </p>
                  <p className="text-sm font-medium text-white">
                    {selectedIndikator.nama_pilar ||
                      `PILAR ${selectedIndikator.pilar_id}`}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1 uppercase font-semibold">
                    Indikator
                  </p>
                  <div className="text-sm font-medium text-white">
                    {formatIndicatorName(selectedIndikator.nama_indikator || selectedIndikator.name)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-[11px] text-gray-400 mb-1 uppercase font-semibold text-center">
                      Satuan
                    </p>
                    <p className="text-sm font-medium text-white text-center">
                      {selectedIndikator.satuan}
                    </p>
                  </div>
                  {(() => {
                    const modalCapaian = selectedIndikator.capaians?.find(
                      (c: any) => c.bulan === bulan && c.tahun === tahun
                    );
                    const targetBulananVal = modalCapaian?.target_bulanan !== undefined
                      ? Number(modalCapaian.target_bulanan)
                      : (selectedIndikator.target_tahunan > 0 ? selectedIndikator.target_tahunan / 12 : 0);

                    return (
                      <>
                        <div className="text-center">
                          <p className="text-[11px] text-gray-400 mb-1 uppercase font-semibold text-center">
                            Target Tahunan
                          </p>
                          <p className="text-sm font-medium text-white font-mono text-center">
                            {Number(
                              selectedIndikator.target_tahunan || 0,
                            ).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] text-gray-400 mb-1 uppercase font-semibold text-center">
                            Target Bulan Ini
                          </p>
                          <p className="text-sm font-medium text-white font-mono text-center">
                            {targetBulananVal.toLocaleString("id-ID", {
                              maximumFractionDigits: 1,
                            })}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nilai Realisasi <span className="text-primary-pink">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputRealisasi}
                      onChange={(e) => setInputRealisasi(formatValue(e.target.value, selectedIndikator.satuan))}
                      placeholder={(() => {
                        const s = (selectedIndikator?.satuan || "").toLowerCase();
                        if (s.includes("orang")) return "Masukkan jumlah orang...";
                        if (s.includes("persen") || s.includes("%")) return "Masukkan persentase (%)...";
                        if (s.includes("rupiah") || s.includes("rp")) return "Masukkan nominal rupiah...";
                        if (s.includes("hektar")) return "Masukkan luas hektar...";
                        return "Masukkan angka realisasi...";
                      })()}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-cyan focus:ring-1 focus:ring-primary-cyan transition-all font-mono text-lg"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-sans text-sm font-medium">
                      {selectedIndikator.satuan}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dokumen Pendukung Realisasi{" "}
                    <span className="text-gray-500 text-xs font-normal">
                      (Opsional)
                    </span>
                  </label>

                  {dokumenUrl && !inputFile ? (
                    <div className="flex items-center justify-between p-4 bg-primary-cyan/10 border border-primary-cyan/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-cyan/20 rounded-lg">
                          <FileText className="w-5 h-5 text-primary-cyan" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Dokumen tersimpan
                          </p>
                          <a
                            href={dokumenUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-cyan hover:underline"
                          >
                            Lihat Dokumen
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => setDokumenUrl("")}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Hapus / Ganti Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : inputFile ? (
                    <div className="flex items-center justify-between p-4 bg-primary-green/10 border border-primary-green/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-green/20 rounded-lg">
                          <FileText className="w-5 h-5 text-primary-green" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-[250px]">
                            {inputFile.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(inputFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setInputFile(null)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Batal Upload"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative group cursor-pointer">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.size > 5 * 1024 * 1024) {
                              alert("Ukuran file maksimal 5 MB");
                              return;
                            }
                            setInputFile(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full px-4 py-6 bg-black/30 border-2 border-dashed border-white/20 rounded-xl group-hover:border-primary-cyan group-hover:bg-primary-cyan/5 transition-all flex flex-col items-center justify-center gap-2 text-center">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary-cyan transition-colors" />
                        <p className="text-sm font-medium text-white group-hover:text-primary-cyan transition-colors">
                          + Upload JPG / PNG / PDF
                        </p>
                        <p className="text-xs text-gray-500">Maksimal 5 MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 pt-4 border-t border-white/10 flex flex-wrap gap-3 shrink-0">
              <button
                onClick={() => {
                  setInputRealisasi("");
                  setInputFile(null);
                  setDokumenUrl("");
                }}
                className="px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
              >
                Reset
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
              >
                {isSaving ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {hasExistingData ? "Simpan Data" : "Simpan Realisasi"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
