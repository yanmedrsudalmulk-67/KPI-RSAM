"use client";

import React, { useEffect, useState, useMemo } from "react";
import { pilarKpi, indicators as indKpi } from "@/lib/data";
import {
  Save,
  FileCheck,
  RefreshCw,
  ChevronDown,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getIndicatorsWithCapaianByYear,
  saveCapaianMultiple,
} from "@/lib/services/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

interface RowItem {
  id: string | number;
  no: string | number;
  name: string;
  isHeader?: boolean;
  ind?: any;
}

const getPilarRows = (pilarName: string, inds: any[]): RowItem[] => {
  const rows: RowItem[] = [];
  
  const getRowNo = (id: number): string | number => {
    const mapping: Record<number, string | number> = {
      1: 1,
      2: 2,
      3: "",
      4: "",
      5: 4,
      6: 5,
      7: 6,
      8: 7,
      9: 8,
      10: 9,
      11: "",
      12: "",
      13: 11,
      14: 12,
      15: 13
    };
    return mapping[id] !== undefined ? mapping[id] : "";
  };

  let addedOptimalisasiAsetParent = false;
  let addedCrossSellingParent = false;

  inds.forEach((ind) => {
    const rawName = ind.nama_indikator || ind.name || "";
    
    if (rawName.startsWith("Jumlah aset yang dimanfaatkan - ")) {
      if (!addedOptimalisasiAsetParent) {
        rows.push({
          id: "parent-optimalisasi-aset",
          no: 3,
          name: "Jumlah aset yang dimanfaatkan",
          isHeader: true
        });
        addedOptimalisasiAsetParent = true;
      }
      const subName = rawName.replace("Jumlah aset yang dimanfaatkan - ", "");
      rows.push({
        id: ind.id,
        no: "",
        name: subName,
        ind
      });
    } else if (rawName.startsWith("Cross selling - ")) {
      if (!addedCrossSellingParent) {
        rows.push({
          id: "parent-cross-selling",
          no: 10,
          name: "Cross selling",
          isHeader: true
        });
        addedCrossSellingParent = true;
      }
      const subName = rawName.replace("Cross selling - ", "");
      rows.push({
        id: ind.id,
        no: "",
        name: subName,
        ind
      });
    } else {
      rows.push({
        id: ind.id,
        no: getRowNo(ind.id),
        name: rawName,
        ind
      });
    }
  });

  return rows;
};

export default function InputKpiPage() {
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMode, setSuccessMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Data capaian KPI berhasil disimpan!");

  // Track inputs: { [indikatorId_bulan]: realisasi }
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [originalInputs, setOriginalInputs] = useState<Record<string, string>>(
    {},
  );

  // Track targets: { [indikatorId]: target_tahunan }
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [originalTargets, setOriginalTargets] = useState<Record<string, string>>(
    {},
  );

  // Track existing capaian ids: { [indikatorId_bulan]: id }
  const [capaianIds, setCapaianIds] = useState<Record<string, number>>({});
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadData(tahun);
  }, [tahun]);

  async function loadData(selectedTahun: number) {
    setLoading(true);
    try {
      let fetchedData: any[] = [];
      let isMock = !isSupabaseConfigured();

      if (isSupabaseConfigured()) {
        try {
          fetchedData = await getIndicatorsWithCapaianByYear(selectedTahun);
          if (fetchedData.length === 0) {
            isMock = true;
          }
        } catch (e) {
          console.error(e);
          isMock = true;
        }
      }

      if (isMock) {
        // Build mock data
        fetchedData = indKpi.map((i) => ({
          ...i,
          nama_pilar: pilarKpi.find((p) => p.id === i.pilarId)?.name || "",
          nama_indikator: i.name,
          target_tahunan: i.target,
          capaians: [],
        }));
      }

      setData(fetchedData);

      // Populate initial inputs and targets
      const initial: Record<string, string> = {};
      const initialTargets: Record<string, string> = {};
      const initialIds: Record<string, number> = {};
      let latestDate: Date | null = null;
      
      fetchedData.forEach((ind) => {
        const rawTarget = (ind.target_tahunan !== undefined && ind.target_tahunan !== null)
          ? ind.target_tahunan.toString()
          : (ind.target || 0).toString();
        initialTargets[ind.id] = formatValue(rawTarget, ind.satuan || "");

        if (ind.capaians) {
          ind.capaians.forEach((c: any) => {
            const rawBulanan = (c.target_bulanan !== undefined && c.target_bulanan !== null) ? c.target_bulanan.toString() : "";
            initial[`${ind.id}_${c.bulan}`] = formatValue(rawBulanan, ind.satuan || "");
            initialIds[`${ind.id}_${c.bulan}`] = c.id;
            
            if (c.updated_at) {
              const d = new Date(c.updated_at);
              if (!latestDate || d > latestDate) {
                latestDate = d;
              }
            }
          });
        }
      });
      setInputs(initial);
      setOriginalInputs(initial);
      setTargets(initialTargets);
      setOriginalTargets(initialTargets);
      setCapaianIds(initialIds);
      setLastUpdated(latestDate);
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
        if (value.endsWith('.') && !numStr.includes('.')) {
          return numStr + ".%";
        } else if (value.endsWith('.') && numStr.endsWith('.')) {
          return numStr + "%"; // actually just let it be, but formatting with % makes it hard to type '.'
        }
        // Actually, if we just append %, what happens when they type `5.` -> `5.%`
        return numStr + "%";
      }
      return "";
    } else if (s.includes("orang") || s.includes("inovasi") || s.includes("posting")) {
      return value.replace(/[^0-9]/g, "");
    } else {
      // hektar, indeks, dll (allow decimal)
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

  const handleInputChange = (
    indikatorId: number,
    bulan: number,
    value: string,
    satuan: string
  ) => {
    let formatted = value;
    // We only format if it doesn't end with . or , to allow decimal typing
    // Actually, formatValue handles it somewhat, but for persen it appends %
    // Let's use formatValue
    formatted = formatValue(value, satuan);
    setInputs((prev) => ({ ...prev, [`${indikatorId}_${bulan}`]: formatted }));
  };

  const handleTargetChange = (indikatorId: number, value: string, satuan: string) => {
    setTargets((prev) => ({ ...prev, [indikatorId]: formatValue(value, satuan) }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!isSupabaseConfigured()) {
        await new Promise((res) => setTimeout(res, 1000));
        setOriginalInputs(inputs);
        setOriginalTargets(targets);
        
        let simulatedUpdate = false;
        data.forEach((ind) => {
          for (let b = 1; b <= 12; b++) {
            const key = `${ind.id}_${b}`;
            if (inputs[key] !== originalInputs[key] && inputs[key] !== undefined) {
              if (originalInputs[key] !== undefined && originalInputs[key] !== "") {
                simulatedUpdate = true;
              }
            }
          }
        });

        setSuccessMessage(simulatedUpdate ? "Data KPI lama berhasil diperbarui!" : "Data KPI baru berhasil disimpan!");
        showSuccess();
        setIsSaving(false);
        return;
      }

      // 1. Detect target changes and save them
      const targetChangesToSave: { id: number; target_tahunan: number }[] = [];
      data.forEach((ind) => {
        const key = ind.id.toString();
        if (targets[key] !== originalTargets[key] && targets[key] !== undefined) {
          const finalTarget = parseRawValue(targets[key] || "");
          targetChangesToSave.push({
            id: ind.id,
            target_tahunan: finalTarget,
          });
        }
      });

      let targetsUpdated = false;
      if (targetChangesToSave.length > 0) {
        for (const change of targetChangesToSave) {
          const { error: targetErr } = await supabase!
            .from("indikator_kpi")
            .update({ target_tahunan: change.target_tahunan })
            .eq("id", change.id);

          if (targetErr) {
            throw new Error(`Gagal menyimpan target KPI: ${targetErr.message}`);
          }
        }
        targetsUpdated = true;
      }

      // 2. Detect target_bulanan changes and save them
      const toSave: any[] = [];
      let isUpdate = false;
      data.forEach((ind) => {
        for (let b = 1; b <= 12; b++) {
          const key = `${ind.id}_${b}`;
          if (
            inputs[key] !== originalInputs[key] &&
            inputs[key] !== undefined
          ) {
            const validValue = parseRawValue(inputs[key] || "");

            const existingCapaian = ind.capaians?.find((c: any) => c.bulan === b);
            const currentRealisasi = existingCapaian ? Number(existingCapaian.realisasi) : 0;

            let pct = 0;
            if (validValue > 0) {
              pct = (currentRealisasi / validValue) * 100;
            }

            let status = "Belum tercapai";
            if (pct >= 100) status = "Tercapai";
            else if (pct >= 80) status = "Perlu perhatian";

            const capaianId = capaianIds[key];
            if (capaianId) {
              isUpdate = true;
            }

            toSave.push({
              ...(capaianId ? { id: capaianId } : {}),
              indikator_id: ind.id,
              bulan: b,
              tahun: tahun,
              target_bulanan: validValue,
              persentase: pct,
              status: status,
            });
          }
        }
      });

      if (toSave.length > 0) {
        await saveCapaianMultiple(toSave);
      }

      if (toSave.length > 0 || targetsUpdated) {
        let msg = "Data capaian KPI berhasil disimpan!";
        if (toSave.length > 0) {
          if (isUpdate) {
            msg = "Data KPI lama berhasil diperbarui!";
          } else {
            msg = "Data KPI baru berhasil disimpan!";
          }
        } else if (targetsUpdated) {
          msg = "Target tahunan KPI berhasil diperbarui!";
        }
        setSuccessMessage(msg);

        setOriginalInputs(inputs);
        setOriginalTargets(targets);
        showSuccess();
        // Reload to get fresh aggregations and dynamic calculations
        await loadData(tahun);
      } else {
        alert("Tidak ada perubahan untuk disimpan.");
      }
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

  const handleReset = () => {
    setInputs(originalInputs);
    setTargets(originalTargets);
  };

  const showSuccess = () => {
    setSuccessMode(true);
    setTimeout(() => setSuccessMode(false), 3000);
  };

  // Group by pilar
  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {};
    data.forEach((ind) => {
      const pName = ind.nama_pilar || `PILAR ${ind.pilar_id || ind.pilarId}`;
      if (!groups[pName]) groups[pName] = [];
      groups[pName].push(ind);
    });
    return groups;
  }, [data]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8 relative">
        <h1 className="text-xl md:text-3xl font-extrabold font-poppins bg-gradient-to-r from-blue-400 via-primary-purple to-primary-pink bg-clip-text text-transparent tracking-tight">
          TARGET KEY PERFORMANCE INDICATOR (KPI)
        </h1>
        <h2 className="text-lg md:text-xl font-bold text-white mt-1">
          UOBK RSUD AL-MULK KOTA SUKABUMI
        </h2>
        <h3 className="text-md md:text-lg font-medium text-gray-400 mt-1">
          PERIODE TAHUN {tahun}
        </h3>
      </div>

      <div className="flex flex-row justify-between items-center gap-4 mb-4 w-full">
        {/* Animated Border Container */}
        <div className="relative p-[2px] rounded-full overflow-hidden group w-auto">
          {/* Rotating gradient background */}
          <div className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#4facfe_25%,#f093fb_50%,#f5576c_75%,transparent_100%)] opacity-80" />
          
          <div className="relative overflow-hidden flex items-center gap-2 bg-[#0b1120] rounded-full p-1 px-3 w-auto backdrop-blur-xl z-10 transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <label className="text-[10px] sm:text-xs font-medium text-gray-300 pl-1">
              Pilih Tahun:
            </label>
            <div className="relative flex items-center">
              <select
                value={tahun}
                onChange={(e) => setTahun(parseInt(e.target.value))}
                className="px-2 sm:px-3 py-1 sm:py-1.5 pr-5 sm:pr-6 bg-black/30 border border-white/5 rounded-lg text-white focus:outline-none focus:border-white/20 transition-colors appearance-none min-w-[70px] sm:min-w-[90px] text-[10px] sm:text-xs font-semibold tracking-wide cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-[#0f172a] text-white">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/70 absolute right-1.5 sm:right-2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-3 w-auto">
          {lastUpdated && (
            <div className="text-xs text-gray-400 mr-2 hidden md:block">
              Terakhir diperbarui: {lastUpdated.toLocaleString("id-ID")}
            </div>
          )}
          <button
            disabled={isSaving}
            onClick={handleSave}
            className="flex flex-none justify-center items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 bg-gradient-to-r from-primary-cyan to-blue-500 rounded-lg text-xs sm:text-sm text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[110px] sm:min-w-[140px]"
          >
            {isSaving ? (
              <span className="animate-spin text-sm block w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Simpan Data
          </button>
        </div>
      </div>

      {successMode && (
        <div className="bg-primary-green/10 border border-primary-green/20 p-4 rounded-xl flex items-center justify-center gap-3 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <CheckCircle2 className="w-6 h-6 text-primary-green" />
          <p className="text-primary-green font-medium">
            {successMessage}
          </p>
        </div>
      )}

      {!isSupabaseConfigured() && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-200">
            Supabase belum dikonfigurasi. Menyimpan data hanya bersifat simulasi
            sementara (Data Dummy).
          </p>
        </div>
      )}

      <div className="p-1 rounded-2xl bg-gradient-to-br from-primary-purple/20 via-transparent to-primary-cyan/20">
        <div className="bg-[#131B2A] rounded-xl overflow-hidden border border-white/5 shadow-2xl relative">
          <div className="overflow-x-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <table className="w-full text-left text-[11px] sm:text-xs whitespace-nowrap">
              <thead className="sticky top-0 z-30 bg-[#310554] backdrop-blur-md text-white">
                <tr>
                  <th className="px-2 py-3 font-semibold text-center border-b border-r border-white/10 w-12 min-w-[48px] max-w-[48px]">
                    NO
                  </th>
                  <th className="px-4 py-3 font-semibold text-center border-b border-r border-white/10 w-[280px] min-w-[280px] max-w-[280px]">
                    URAIAN KPI
                  </th>
                  <th className="px-3 py-3 font-semibold text-center border-b border-r border-white/10 w-24 min-w-[96px] max-w-[96px]">
                    SATUAN
                  </th>
                  <th className="px-3 py-3 font-semibold text-center border-b border-r border-white/10 w-[210px] min-w-[210px] max-w-[210px] leading-tight tracking-tight uppercase">
                    TARGET TAHUNAN
                  </th>
                  {MONTHS.map((m, idx) => (
                    <th
                      key={m}
                      className={`px-2 py-3 font-semibold text-center border-b border-r border-white/10 min-w-[165px] w-40 ${idx % 2 === 0 ? "bg-[#581c87]" : "bg-[#310554]"}`}
                    >
                      {m.toUpperCase()}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold text-center border-b border-r border-white/10 min-w-[140px] w-40">
                    TOTAL
                  </th>
                  <th className="px-4 py-3 font-semibold text-center border-b border-r border-white/10 min-w-[90px] w-24">
                    %
                  </th>
                  <th className="px-3 py-3 font-semibold text-center border-b border-white/10 min-w-[140px] w-40">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {loading ? (
                  <tr>
                    <td colSpan={19} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full border-4 border-primary-purple opacity-20 border-t-primary-purple animate-spin" />
                        <span className="text-gray-400">
                          Memuat data KPI...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    let globalRowIdx = 0;
                    return Object.entries(groupedData).map(
                      ([pilarName, inds], groupIndex) => {
                        globalRowIdx++; // Increment for the Pilar Header Row (Row 1)
                        return (
                          <React.Fragment key={pilarName}>
                            {/* Pilar Header Row */}
                            <tr className="bg-[#1a0f2b]">
                          <td className="px-2 py-2 font-bold text-white border-r border-white/10 bg-[#1a0f2b] w-12 min-w-[48px] max-w-[48px]"></td>
                          <td className="px-4 py-2 font-bold text-white border-r border-white/10 bg-[#1a0f2b] uppercase whitespace-normal leading-tight w-[280px] min-w-[280px] max-w-[280px]">
                            {pilarName.includes(
                              "DAN PROGRAM PRIORITAS LAINNYA",
                            ) ? (
                              <>
                                {pilarName.replace(
                                  " DAN PROGRAM PRIORITAS LAINNYA",
                                  "",
                                )}
                                <br />
                                DAN PROGRAM PRIORITAS LAINNYA
                              </>
                            ) : (
                              pilarName
                            )}
                          </td>
                          <td className="px-2 py-2 font-bold text-white border-r border-white/10 bg-[#1a0f2b] w-24 min-w-[96px] max-w-[96px]"></td>
                          <td className="px-2 py-2 font-bold text-white border-r border-white/10 bg-[#1a0f2b] w-[210px] min-w-[210px] max-w-[210px]"></td>
                          <td
                            className="px-2 py-2 border-r border-white/10 bg-[#1a0f2b]"
                            colSpan={15}
                          ></td>
                        </tr>
                        {/* Indicators Rows */}
                        {getPilarRows(pilarName, inds).map((rowItem, rowIdx) => {
                          const itemRowIdx = ++globalRowIdx;
                          const isEven = rowIdx % 2 === 0;
                          const rowBgClass = isEven ? "bg-[#140e24]" : "bg-[#1e1433]";
                          const stickyBgClass = isEven ? "bg-[#140e24]" : "bg-[#1e1433]";
                          const stickyHoverClass = isEven ? "group-hover:bg-[#201738]" : "group-hover:bg-[#2c1d4a]";

                          if (rowItem.isHeader) {
                            return (
                              <tr key={rowItem.id} className="bg-[#24133d] group border-b border-white/5">
                                <td className="px-2 py-3 text-center border-r border-white/10 bg-[#24133d] group-hover:bg-[#2f1b4d] transition-all text-gray-300 font-mono w-12 min-w-[48px] max-w-[48px]">
                                  {rowItem.no}
                                </td>
                                <td className={`px-4 py-3 border-r border-white/10 bg-[#24133d] group-hover:bg-[#2f1b4d] transition-all text-white whitespace-normal leading-relaxed w-[280px] min-w-[280px] max-w-[280px] ${itemRowIdx === 4 || itemRowIdx === 6 ? "font-normal" : "font-bold"}`}>
                                  {rowItem.name}
                                </td>
                                <td className="px-3 py-3 text-center border-r border-white/10 bg-[#24133d] group-hover:bg-[#2f1b4d] transition-all text-gray-500 w-24 min-w-[96px] max-w-[96px]">
                                  -
                                </td>
                                <td className="px-3 py-2 text-center border-r border-white/10 bg-[#24133d] group-hover:bg-[#2f1b4d] transition-all w-[210px] min-w-[210px] max-w-[210px]">
                                  -
                                </td>
                                {MONTHS.map((_, mIdx) => (
                                  <td
                                    key={mIdx}
                                    className={`px-2 py-2 border-r border-white/10 text-center text-gray-500 font-mono min-w-[165px] w-40 ${mIdx % 2 === 0 ? "bg-[#291745]" : "bg-[#201038]"}`}
                                  >
                                    -
                                  </td>
                                ))}
                                <td className="px-4 py-3 text-center border-r border-white/10 font-mono font-semibold text-gray-500 bg-[#24133d] group-hover:bg-[#2f1b4d] min-w-[140px] w-40">
                                  -
                                </td>
                                <td className="px-4 py-3 text-center border-r border-white/10 font-mono font-bold text-gray-500 bg-[#24133d] group-hover:bg-[#2f1b4d] min-w-[90px] w-24">
                                  -
                                </td>
                                <td className="px-3 py-3 text-center bg-[#24133d] group-hover:bg-[#2f1b4d] min-w-[140px] w-40">
                                  -
                                </td>
                              </tr>
                            );
                          }

                          const ind = rowItem.ind;
                          let totalTargetBulanan = 0;
                          for (let b = 1; b <= 12; b++) {
                            const val = parseRawValue(
                              inputs[`${ind.id}_${b}`] || "",
                            );
                            if (!isNaN(val)) totalTargetBulanan += val;
                          }

                          const currentTargetVal = parseRawValue(targets[ind.id] || "");
                          let progress =
                            currentTargetVal > 0
                              ? (totalTargetBulanan / currentTargetVal) * 100
                              : 0;
                          let status = "Belum tercapai";
                          if (progress >= 100) status = "Tercapai";
                          else if (progress >= 80) status = "Perlu perhatian";

                          const isTargetChanged = (targets[ind.id] || "") !== (originalTargets[ind.id] || "");

                          // Determine placeholder based on Satuan
                          const s = (ind.satuan || "").toLowerCase();
                          let placeholder = "0";
                          if (s.includes("orang")) placeholder = "Jml orang";
                          else if (s.includes("persen") || s.includes("%")) placeholder = "%";
                          else if (s.includes("rupiah") || s.includes("rp")) placeholder = "Rp 0";
                          else if (s.includes("hektar")) placeholder = "Luas";

                          const isSubItem = rowItem.no === "";

                          return (
                            <tr
                              key={ind.id}
                              className={`${rowBgClass} transition-colors group`}
                            >
                              <td className={`px-2 py-3 text-center border-r border-white/10 ${stickyHoverClass} transition-all text-gray-400 font-mono w-12 min-w-[48px] max-w-[48px]`}>
                                {rowItem.no}
                              </td>
                              <td className={`px-4 py-3 border-r border-white/10 ${stickyHoverClass} transition-all whitespace-normal leading-relaxed w-[280px] min-w-[280px] max-w-[280px] text-[11px] ${isSubItem ? "pl-8 text-gray-300 font-normal" : (itemRowIdx === 4 || itemRowIdx === 6 ? "text-white font-normal" : "text-white font-semibold")}`}>
                                {rowItem.name}
                              </td>
                              <td className={`px-3 py-3 text-center border-r border-white/10 ${stickyHoverClass} transition-all text-gray-200 font-semibold w-24 min-w-[96px] max-w-[96px]`}>
                                {ind.satuan}
                              </td>
                              <td className={`px-3 py-2 text-center border-r border-white/10 ${stickyHoverClass} transition-all w-[210px] min-w-[210px] max-w-[210px]`}>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={targets[ind.id] || ""}
                                  onChange={(e) => {
                                    handleTargetChange(ind.id, e.target.value, ind.satuan || "");
                                  }}
                                  placeholder={placeholder}
                                  className="w-[170px] px-2 py-1.5 bg-black/50 border rounded text-white focus:outline-none focus:ring-1 focus:ring-primary-cyan text-center font-mono transition-all border-white/10 focus:border-primary-cyan/50"
                                />
                              </td>

                              {/* 12 Months Input Fields */}
                              {MONTHS.map((_, mIdx) => {
                                const b = mIdx + 1;
                                const vKey = `${ind.id}_${b}`;
                                const val = inputs[vKey] || "";
                                const isChanged = val !== originalInputs[vKey];
                                return (
                                  <td
                                    key={b}
                                    className={`px-2 py-2 border-r border-white/10 text-center min-w-[165px] w-40 ${mIdx % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                                  >
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={val}
                                      onChange={(e) => {
                                        handleInputChange(ind.id, b, e.target.value, ind.satuan || "");
                                      }}
                                      placeholder="-"
                                      className="w-[140px] px-2 py-1.5 bg-black/50 border rounded text-white focus:outline-none focus:ring-1 focus:ring-primary-cyan text-center font-mono transition-all border-white/10 focus:border-primary-cyan/50"
                                    />
                                  </td>
                                );
                              })}

                              <td className="px-4 py-3 text-center border-r border-white/10 font-mono font-semibold text-gray-100 min-w-[140px] w-40">
                                {formatValue(totalTargetBulanan.toString(), ind.satuan || "") || "0"}
                              </td>
                              <td className="px-4 py-3 text-center border-r border-white/10 font-mono font-bold text-white min-w-[90px] w-24">
                                {progress.toFixed(1)}%
                              </td>
                              <td className="px-3 py-3 text-center min-w-[140px] w-40">
                                <span
                                  className={`inline-block px-3 py-1 flex items-center justify-center font-semibold rounded-full whitespace-nowrap min-w-[100px] mx-auto text-center ${
                                    status === "Tercapai"
                                      ? "bg-primary-green/10 text-primary-green"
                                      : status === "Perlu perhatian"
                                        ? "bg-primary-gold/10 text-primary-gold"
                                        : "bg-primary-pink/10 text-primary-pink"
                                  }`}
                                >
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
