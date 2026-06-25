"use client";

import React, { useEffect, useState, useMemo } from "react";
import { pilarKpi, indicators as indKpi } from "@/lib/data";
import {
  Save,
  FileCheck,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getIndicatorsWithCapaianByYear,
  saveCapaianMultiple,
} from "@/lib/services/api";
import { isSupabaseConfigured } from "@/lib/supabase";

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

export default function InputKpiPage() {
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMode, setSuccessMode] = useState(false);

  // Track inputs: { [indikatorId_bulan]: realisasi }
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [originalInputs, setOriginalInputs] = useState<Record<string, string>>(
    {},
  );

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

      // Populate initial inputs
      const initial: Record<string, string> = {};
      fetchedData.forEach((ind) => {
        if (ind.capaians) {
          ind.capaians.forEach((c: any) => {
            initial[`${ind.id}_${c.bulan}`] = c.realisasi.toString();
          });
        }
      });
      setInputs(initial);
      setOriginalInputs(initial);
    } catch (error) {
      console.error("Error loading data", error);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (
    indikatorId: number,
    bulan: number,
    value: string,
  ) => {
    setInputs((prev) => ({ ...prev, [`${indikatorId}_${bulan}`]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!isSupabaseConfigured()) {
        await new Promise((res) => setTimeout(res, 1000));
        setOriginalInputs(inputs);
        showSuccess();
        setIsSaving(false);
        return;
      }

      const toSave: any[] = [];
      data.forEach((ind) => {
        for (let b = 1; b <= 12; b++) {
          const key = `${ind.id}_${b}`;
          if (
            inputs[key] !== originalInputs[key] &&
            inputs[key] !== undefined
          ) {
            const rs = parseFloat(inputs[key]);
            const validValue = isNaN(rs) ? 0 : rs;

            let pct = 0;
            if (ind.target_tahunan > 0) {
              pct = (validValue / ind.target_tahunan) * 100;
            }

            let status = "Belum tercapai";
            if (pct >= 100) status = "Tercapai";
            else if (pct >= 80) status = "Perlu perhatian";

            toSave.push({
              indikator_id: ind.id,
              bulan: b,
              tahun: tahun,
              realisasi: validValue,
              persentase: pct,
              status: status,
            });
          }
        }
      });

      if (toSave.length > 0) {
        await saveCapaianMultiple(toSave);
        setOriginalInputs(inputs);
        showSuccess();
        // Reload to get fresh aggregations if needed
        loadData(tahun);
      } else {
        alert("Tidak ada perubahan untuk disave.");
      }
    } catch (e: any) {
      alert("Gagal menyimpan data: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setInputs(originalInputs);
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
          KEY PERFORMANCE INDICATOR (KPI) BULANAN
        </h1>
        <h2 className="text-lg md:text-xl font-bold text-white mt-1">
          UOBK RSUD AL-MULK KOTA SUKABUMI
        </h2>
        <h3 className="text-md md:text-lg font-medium text-gray-400 mt-1">
          PERIODE TAHUN {tahun}
        </h3>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-3 bg-dark-navy p-1.5 rounded-xl border border-white/10 w-full md:w-auto">
          <label className="text-sm font-medium text-gray-300 pl-2">
            Pilih Tahun:
          </label>
          <select
            value={tahun}
            onChange={(e) => setTahun(parseInt(e.target.value))}
            className="px-4 py-2 bg-black/30 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary-purple transition-colors appearance-none min-w-[120px]"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y} className="bg-dark-navy">
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            disabled={isSaving}
            onClick={handleSave}
            className="flex flex-1 justify-center items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary-cyan to-blue-500 rounded-lg text-sm text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[160px]"
          >
            {isSaving ? (
              <span className="animate-spin text-lg block w-4 h-4 rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Data
          </button>
        </div>
      </div>

      {successMode && (
        <div className="bg-primary-green/10 border border-primary-green/20 p-4 rounded-xl flex items-center justify-center gap-3 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <CheckCircle2 className="w-6 h-6 text-primary-green" />
          <p className="text-primary-green font-medium">
            Data capaian KPI berhasil disimpan!
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
            <table className="w-full text-left text-[10px] sm:text-[11px] whitespace-nowrap">
              <thead className="sticky top-0 z-30 bg-gradient-to-r from-primary-purple/40 to-blue-900/40 backdrop-blur-md text-white">
                <tr>
                  <th className="px-1 py-3 font-semibold text-center border-b border-r border-white/10 w-8">
                    NO
                  </th>
                  <th className="px-2 py-3 font-semibold border-b border-r border-white/10 w-48">
                    URAIAN KPI
                  </th>
                  <th className="px-1 py-3 font-semibold text-center border-b border-r border-white/10 w-12">
                    SAT
                  </th>
                  <th className="px-1 py-3 font-semibold text-center border-b border-r border-white/10 w-16">
                    TARGET
                  </th>
                  {MONTHS.map((m, idx) => (
                    <th
                      key={m}
                      className={`px-1 py-3 font-semibold text-center border-b border-r border-white/10 w-min ${idx % 2 === 0 ? "bg-white/5" : ""}`}
                    >
                      {m.toUpperCase()}
                    </th>
                  ))}
                  <th className="px-1 py-3 font-semibold text-center border-b border-white/10 bg-primary-cyan/10 w-16">
                    TOTAL
                  </th>
                  <th className="px-1 py-3 font-semibold text-center border-b border-white/10 bg-primary-cyan/10 w-12">
                    %
                  </th>
                  <th className="px-1 py-3 font-semibold text-center border-b border-white/10 w-20">
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
                  Object.entries(groupedData).map(
                    ([pilarName, inds], groupIndex) => (
                      <React.Fragment key={pilarName}>
                        {/* Pilar Header Row */}
                        <tr className="bg-white/5">
                          <td className="px-1 py-2 font-bold text-white border-r border-white/10 bg-[#1C253B]"></td>
                          <td className="px-2 py-2 font-bold text-white border-r border-white/10 bg-[#1C253B] uppercase">
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
                          <td className="px-1 py-2 font-bold text-white border-r border-white/10 bg-[#1C253B]"></td>
                          <td className="px-1 py-2 font-bold text-white border-r border-white/10 bg-[#1C253B]"></td>
                          <td
                            className="px-1 py-2 border-r border-white/10 bg-[#1C253B]"
                            colSpan={15}
                          ></td>
                        </tr>
                        {/* Indicators Rows */}
                        {inds.map((ind, indIdx) => {
                          let totalRealisasi = 0;
                          for (let b = 1; b <= 12; b++) {
                            const val = parseFloat(
                              inputs[`${ind.id}_${b}`] || "0",
                            );
                            if (!isNaN(val)) totalRealisasi += val;
                          }

                          let progress =
                            ind.target_tahunan > 0
                              ? (totalRealisasi / ind.target_tahunan) * 100
                              : 0;
                          let status = "Belum tercapai";
                          if (progress >= 100) status = "Tercapai";
                          else if (progress >= 80) status = "Perlu perhatian";

                          return (
                            <tr
                              key={ind.id}
                              className="hover:bg-white/5 transition-colors group"
                            >
                              <td className="px-1 py-2 text-center border-r border-white/10 bg-[#151D2A] group-hover:bg-[#1A2333] transition-colors text-gray-500 font-mono">
                                {indIdx + 1}
                              </td>
                              <td className="px-2 py-2 border-r border-white/10 bg-[#151D2A] group-hover:bg-[#1A2333] transition-colors whitespace-normal min-w-[150px] max-w-[200px] leading-tight">
                                {ind.nama_indikator || ind.name}
                              </td>
                              <td className="px-1 py-2 text-center border-r border-white/10 bg-[#151D2A] group-hover:bg-[#1A2333] transition-colors">
                                {ind.satuan}
                              </td>
                              <td className="px-1 py-2 text-center border-r border-white/10 font-mono font-medium text-white bg-[#151D2A] group-hover:bg-[#1A2333] transition-colors">
                                {Number(
                                  ind.target_tahunan || ind.target || 0,
                                ).toLocaleString("id-ID")}
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
                                    className={`px-1 py-1 border-r border-white/10 ${mIdx % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                                  >
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={val}
                                      onChange={(e) => {
                                        const v = e.target.value.replace(
                                          /[^0-9.]/g,
                                          "",
                                        );
                                        handleInputChange(ind.id, b, v);
                                      }}
                                      placeholder="-"
                                      className={`w-[40px] px-1 py-1 bg-black/40 border rounded text-white focus:outline-none focus:ring-1 focus:ring-primary-cyan text-center font-mono transition-colors ${
                                        isChanged
                                          ? "border-primary-cyan shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                                          : "border-white/5 focus:border-white/20"
                                      }`}
                                    />
                                  </td>
                                );
                              })}

                              <td className="px-1 py-2 text-right border-x border-white/10 font-mono font-medium text-cyan-400 bg-primary-cyan/5">
                                {totalRealisasi.toLocaleString("id-ID")}
                              </td>
                              <td className="px-1 py-2 text-right border-r border-white/10 font-mono font-bold text-white bg-primary-cyan/5">
                                {progress.toFixed(1)}%
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span
                                  className={`inline-block px-1.5 py-0.5 flex items-center justify-center text-[9px] rounded-full whitespace-nowrap ${
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
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
