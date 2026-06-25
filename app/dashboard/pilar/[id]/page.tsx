"use client";

import { use, useState, useEffect, useMemo } from "react";
import { pilarKpi, indicators as indKpi } from "@/lib/data";
import {
  ArrowLeft,
  BarChart2,
  TrendingUp,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { getPilarDetail } from "@/lib/services/api";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export default function PilarDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const pilarId = parseInt(resolvedParams.id);
  const [pilar, setPilar] = useState<any>(null);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [searchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Chart States
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [selectedGraphIndikator, setSelectedGraphIndikator] =
    useState<string>("");
  const [selectedGraphTahun, setSelectedGraphTahun] = useState<string>(
    new Date().getFullYear().toString(),
  );

  useEffect(() => {
    if (indicators.length > 0 && !selectedGraphIndikator) {
      setSelectedGraphIndikator(indicators[0].id.toString());
    }
  }, [indicators, selectedGraphIndikator]);

  useEffect(() => {
    async function load() {
      let isMock = !isSupabaseConfigured();
      if (isSupabaseConfigured()) {
        try {
          const { pilar: p, indicators: ind } = await getPilarDetail(pilarId);
          if (!p) {
            isMock = true;
          } else {
            setPilar(p);
            setIndicators(ind);
          }
        } catch (e: any) {
          if (e?.code !== "PGRST205") {
            console.error("DB error fallback", e);
          }
          isMock = true; // DB issue, fallback to mock
        }
      }

      if (isMock) {
        const foundPilar = pilarKpi.find((p) => p.id === pilarId);
        if (foundPilar) {
          setPilar({ ...foundPilar, nama_pilar: foundPilar.name });
          const currYear = new Date().getFullYear();
          setIndicators(
            indKpi
              .filter((i) => i.pilarId === pilarId)
              .map((i) => ({
                ...i,
                nama_indikator: i.name,
                target_tahunan: i.target,
                totalRealisasi: i.realisasi,
                progress: i.capaian,
                capaian_kpi: [
                  {
                    bulan: 1,
                    tahun: currYear,
                    realisasi: i.target ? (i.target / 12) * 0.9 : 0,
                    dokumen_url: "https://picsum.photos/800/600?random=1",
                  },
                  {
                    bulan: 2,
                    tahun: currYear,
                    realisasi: i.target ? (i.target / 12) * 0.95 : 0,
                    dokumen_url: "https://picsum.photos/800/600?random=2",
                  },
                  {
                    bulan: 3,
                    tahun: currYear,
                    realisasi: i.target ? (i.target / 12) * 1.0 : 0,
                  },
                  {
                    bulan: 4,
                    tahun: currYear,
                    realisasi: i.target ? (i.target / 12) * 0.8 : 0,
                  },
                  {
                    bulan: 5,
                    tahun: currYear,
                    realisasi: i.target ? (i.target / 12) * 0.85 : 0,
                    dokumen_url: "https://picsum.photos/800/600?random=3",
                  },
                  {
                    bulan: 6,
                    tahun: currYear,
                    realisasi: i.target ? (i.target / 12) * 1.1 : 0,
                  },
                ],
              })),
          );
        }
      }
      setLoading(false);
    }
    load();
  }, [pilarId]);

  const selectedIndObj = indicators.find(
    (i) => i.id.toString() === selectedGraphIndikator,
  );

  const chartData = useMemo(() => {
    if (!selectedIndObj) return [];

    const targetTahunan = Number(
      selectedIndObj.target_tahunan || selectedIndObj.target || 0,
    );
    const targetBulanan =
      targetTahunan > 0 ? Number((targetTahunan / 12).toFixed(2)) : 0;

    const capList = selectedIndObj.capaian_kpi || selectedIndObj.capaians || [];

    const data = [];
    const months = [
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

    for (let i = 1; i <= 12; i++) {
      const capaian = capList.find(
        (c: any) => c.bulan === i && c.tahun === parseInt(selectedGraphTahun),
      );

      data.push({
        name: months[i - 1],
        Target: targetBulanan,
        Realisasi: capaian ? Number(capaian.realisasi) : 0,
        dokumen_url: capaian ? capaian.dokumen_url : null,
      });
    }

    return data;
  }, [selectedIndObj, selectedGraphTahun]);

  const selectedMonthDocs = useMemo(() => {
    return chartData
      .filter((d) => d.dokumen_url)
      .map((d, index) => ({
        id: index,
        month: d.name,
        url: d.dokumen_url,
      }));
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-primary-purple opacity-20 border-t-primary-purple animate-spin" />
      </div>
    );
  }

  if (!pilar) {
    return <div className="text-white">Pilar tidak ditemukan</div>;
  }

  const filteredIndicators = indicators.filter((ind) =>
    ind.nama_indikator.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalTarget = indicators.reduce(
    (sum, ind) => sum + Number(ind.target_tahunan || 0),
    0,
  );
  const totalProgress = indicators.reduce((sum, ind) => sum + ind.progress, 0);
  const avgProgress =
    indicators.length > 0 ? (totalProgress / indicators.length).toFixed(1) : 0;

  const pilarColor =
    pilarId % 2 === 0
      ? "from-primary-purple to-primary-pink"
      : "from-primary-cyan to-blue-500";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back & Breadcrumb */}
      <div className="flex items-center gap-4 text-gray-400 text-sm">
        <Link
          href="/dashboard"
          className="hover:text-white transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        <span>/</span>
        <span>Detail Pilar</span>
        <span>/</span>
        <span className="text-primary-purple font-medium">
          {pilar.nama_pilar}
        </span>
      </div>

      {/* Header Card */}
      <div
        className={`p-6 rounded-2xl bg-gradient-to-br ${pilarColor} text-white shadow-lg relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-poppins mb-2">
              {pilar.nama_pilar}
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium mb-1 opacity-80">
              Rata-rata Capaian
            </span>
            <div className="text-4xl font-bold tracking-tight">
              {avgProgress}%
            </div>
          </div>
        </div>
      </div>

      {/* Table Section MASTER DATA */}
      <div className="p-4 sm:p-6 rounded-2xl glassmorphism mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-white font-poppins">
            CAPAIAN BULANAN
          </h2>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full text-left text-[11px] sm:text-xs text-gray-300">
            <thead className="bg-dark-navy/50 text-gray-400 uppercase font-medium whitespace-nowrap">
              <tr>
                <th className="px-2 sm:px-3 py-2 sm:py-3 rounded-tl-lg">No</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 min-w-[150px]">
                  Nama Indikator
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-3">Sat</th>
                <th className="px-2 sm:px-3 py-2 sm:py-3 text-right">Target</th>
                {[
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
                ].map((bln, i) => (
                  <th
                    key={bln}
                    className={`px-2 sm:px-3 py-2 sm:py-3 text-right ${i === 11 ? "rounded-tr-lg" : ""}`}
                  >
                    {bln}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredIndicators.map((ind, idx) => (
                <tr key={ind.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-2 sm:px-3 py-2 sm:py-3 align-top">
                    {idx + 1}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 font-medium text-white max-w-[200px] leading-tight">
                    {ind.nama_indikator}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 align-top whitespace-nowrap">
                    {ind.satuan || "-"}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-3 text-right font-mono font-medium text-primary-cyan align-top whitespace-nowrap">
                    {Number(ind.target_tahunan || 0).toLocaleString("id-ID")}
                  </td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((bulan) => {
                    const capList = ind.capaian_kpi || ind.capaians || [];
                    const cap = capList.find((c: any) => c.bulan === bulan);
                    const val = cap ? cap.realisasi : null;
                    return (
                      <td
                        key={bulan}
                        className="px-2 sm:px-3 py-2 sm:py-3 text-right font-mono align-top text-white/80"
                      >
                        {val !== null
                          ? Number(val).toLocaleString("id-ID", {
                              maximumFractionDigits: 1,
                            })
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {filteredIndicators.length === 0 && (
                <tr>
                  <td
                    colSpan={16}
                    className="px-4 py-8 text-center text-gray-500 text-sm"
                  >
                    Tidak ada indikator ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRAFIK CAPAIAN */}
      <div className="p-6 rounded-2xl glassmorphism mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white font-poppins flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary-cyan" />
            GRAFIK CAPAIAN
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedGraphIndikator}
              onChange={(e) => setSelectedGraphIndikator(e.target.value)}
              className="px-4 py-2 bg-dark-navy border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-cyan text-sm max-w-[200px] truncate"
            >
              {indicators.map((ind) => (
                <option key={ind.id} value={ind.id.toString()}>
                  {ind.nama_indikator}
                </option>
              ))}
            </select>

            <select
              value={selectedGraphTahun}
              onChange={(e) => setSelectedGraphTahun(e.target.value)}
              className="px-4 py-2 bg-dark-navy border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-cyan text-sm"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>

            <div className="flex bg-dark-navy p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-md transition-colors ${chartType === "bar" ? "bg-white/10 text-primary-cyan" : "text-gray-400 hover:text-white"}`}
                title="Bar Chart"
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`p-1.5 rounded-md transition-colors ${chartType === "line" ? "bg-white/10 text-primary-pink" : "text-gray-400 hover:text-white"}`}
                title="Trend Line Chart"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full bg-black/20 rounded-xl p-4 border border-white/5">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff10"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#ffffff50"
                    tick={{ fill: "#ffffff80", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#ffffff50"
                    tick={{ fill: "#ffffff80", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A233A",
                      border: "1px solid #ffffff10",
                      borderRadius: "12px",
                    }}
                    itemStyle={{ fontWeight: "bold" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar
                    dataKey="Target"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar
                    dataKey="Realisasi"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  >
                    <LabelList
                      dataKey="Realisasi"
                      position="top"
                      fill="#ffffff"
                      fontSize={11}
                      formatter={(val: number) =>
                        val > 0 ? val.toLocaleString("id-ID") : ""
                      }
                    />
                  </Bar>
                </BarChart>
              ) : (
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff10"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#ffffff50"
                    tick={{ fill: "#ffffff80", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#ffffff50"
                    tick={{ fill: "#ffffff80", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A233A",
                      border: "1px solid #ffffff10",
                      borderRadius: "12px",
                    }}
                    itemStyle={{ fontWeight: "bold" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Line
                    type="monotone"
                    dataKey="Target"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Realisasi"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList
                      dataKey="Realisasi"
                      position="top"
                      fill="#ffffff"
                      fontSize={11}
                      offset={10}
                      formatter={(val: number) =>
                        val > 0 ? val.toLocaleString("id-ID") : ""
                      }
                    />
                  </Line>
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Pilih indikator untuk melihat grafik
            </div>
          )}
        </div>
      </div>

      {/* VISUALISASI DOKUMEN */}
      <div className="p-6 rounded-2xl glassmorphism mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white font-poppins flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary-pink" />
            VISUALISASI DOKUMEN REALISASI
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Dokumen pendukung yang diunggah pada menu Realisasi untuk indikator
            terpilih.
          </p>
        </div>

        {selectedMonthDocs.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {selectedMonthDocs.map((doc) => {
              const isPdf = doc.url.toLowerCase().endsWith(".pdf");
              return (
                <div
                  key={doc.id}
                  className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden"
                >
                  <div className="bg-dark-navy px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-cyan" />
                    <h3 className="text-sm font-semibold text-white uppercase">
                      Realisasi Bulan {doc.month}
                    </h3>
                  </div>
                  <div className="w-full bg-black/50 flex items-center justify-center p-4">
                    {isPdf ? (
                      <iframe
                        src={doc.url}
                        className="w-full h-[600px] rounded-lg border border-white/5 bg-white"
                        title={`Dokumen ${doc.month}`}
                      />
                    ) : (
                      <img
                        src={doc.url}
                        alt={`Dokumen ${doc.month}`}
                        className="w-full max-w-full rounded-lg object-contain max-h-[800px] border border-white/5"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-black/20 border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-1">Belum ada dokumen</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Tidak ada dokumen realisasi yang dilampirkan untuk indikator ini
              pada tahun {selectedGraphTahun}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
