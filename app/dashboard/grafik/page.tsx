"use client";

import { useEffect, useState, useMemo } from "react";
import { pilarKpi } from "@/lib/data";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  ResponsiveContainer, Tooltip, Legend, XAxis, YAxis, CartesianGrid, LabelList
} from "recharts";
import { 
  Activity, Target, AlertTriangle, TrendingUp, 
  AlertCircle, ChevronDown, Filter, Calendar, LayoutGrid, CheckCircle2, XCircle, PieChart as PieChartIcon, Edit2, Check
} from "lucide-react";
import { getAllDataForAnalytics, getDashboardSummaryText, saveDashboardSummaryText } from "@/lib/services/api";
import { isSupabaseConfigured } from "@/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#10B981', '#3B82F6', '#EF4444'];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }: any) => {
  if (value === 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight="bold">
      {value}
    </text>
  );
};

const CustomXAxisTick = ({ x, y, payload }: any) => {
  const isPilar6 = payload.value.startsWith("PILAR 6");
  
  if (isPilar6) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748B" fontSize={8}>
          PILAR 6
        </text>
        <text x={0} y={0} dy={28} textAnchor="middle" fill="#64748B" fontSize={7}>
          IKU
        </text>
        <text x={0} y={0} dy={40} textAnchor="middle" fill="#64748B" fontSize={8}>
          PROGRAM UNGGULAN
        </text>
      </g>
    );
  }

  const parts = payload.value.split(" - ");
  if (parts.length === 2) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748B" fontSize={8}>
          {parts[0]}
        </text>
        <text x={0} y={0} dy={28} textAnchor="middle" fill="#64748B" fontSize={10}>
          {parts[1]}
        </text>
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748B" fontSize={10}>
        {payload.value}
      </text>
    </g>
  );
};

export default function GrafikPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterTahun, setFilterTahun] = useState<number>(new Date().getFullYear());
  const [filterPeriode, setFilterPeriode] = useState<string>("Tahunan");
  const [filterPilar, setFilterPilar] = useState<string>("Semua");

  const [compareYear1, setCompareYear1] = useState<number>(new Date().getFullYear() - 1);
  const [compareYear2, setCompareYear2] = useState<number>(new Date().getFullYear());

  const [capaianChartType, setCapaianChartType] = useState<"bar" | "line">("bar");

  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [customSummaryText, setCustomSummaryText] = useState("");
  const [savedSummaryText, setSavedSummaryText] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured()) {
        try {
          const res = await getAllDataForAnalytics();
          setData(res);
        } catch(e) {
          console.error(e);
        }
      } 
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadSummary() {
      let txt: string | null = null;
      if (isSupabaseConfigured()) {
        try {
          txt = await getDashboardSummaryText(filterTahun, filterPeriode);
        } catch (e) {
          console.error(e);
        }
      }
      
      // Fallback to local storage if Supabase is not configured or table is missing/empty
      if (!txt) {
        txt = localStorage.getItem(`summary_${filterTahun}_${filterPeriode}`);
      }
      
      setSavedSummaryText(txt);
    }
    loadSummary();
  }, [filterTahun, filterPeriode]);

  // Process data based on filters
  const processedData = useMemo(() => {
    let filtered = data;
    if (filterPilar !== "Semua") {
      filtered = filtered.filter(d => d.pilar === filterPilar);
    }

    return filtered.map(ind => {
      let targetValue = 0;
      let realisasiValue = 0;
      
      const targetTahunan = Number(ind.target_tahunan || 0);
      
      let capaians = ind.capaian_kpi?.filter((c: any) => c.tahun === filterTahun) || [];
      
      // Filter by periode
      if (filterPeriode !== "Tahunan") {
        if (filterPeriode.startsWith("Semester")) {
          const isS1 = filterPeriode === "Semester 1";
          capaians = capaians.filter((c: any) => isS1 ? c.bulan <= 6 : c.bulan > 6);
          targetValue = targetTahunan / 2;
        } else if (filterPeriode.startsWith("Q")) {
          const q = parseInt(filterPeriode.replace("Q", ""));
          capaians = capaians.filter((c: any) => c.bulan > (q-1)*3 && c.bulan <= q*3);
          targetValue = targetTahunan / 4;
        } else {
          const b = parseInt(filterPeriode);
          capaians = capaians.filter((c: any) => c.bulan === b);
          
          const matched = capaians.find((c: any) => c.bulan === b);
          if (matched && matched.target_bulanan !== null && matched.target_bulanan !== undefined) {
             targetValue = Number(matched.target_bulanan);
          } else {
             targetValue = targetTahunan / 12;
          }
        }
      } else {
        targetValue = targetTahunan;
      }

      realisasiValue = capaians.reduce((sum: number, c: any) => sum + Number(c.realisasi || 0), 0);

      // If not monthly specific override, calculate target properly if it's accumulated
      if (filterPeriode === "Tahunan" || filterPeriode.startsWith("Semester") || filterPeriode.startsWith("Q")) {
         // Accumulate target from capaians if they have specific target_bulanan, else use standard fraction
         let customTarget = 0;
         let hasCustomTarget = false;
         capaians.forEach((c: any) => {
           if (c.target_bulanan !== null && c.target_bulanan !== undefined) {
             customTarget += Number(c.target_bulanan);
             hasCustomTarget = true;
           } else {
             customTarget += targetTahunan / 12;
           }
         });
         if (hasCustomTarget) targetValue = customTarget;
      }

      let progress = 0;
      let status = "Belum Tercapai";
      
      if (targetValue > 0) {
        progress = (realisasiValue / targetValue) * 100;
        if (progress > 100) progress = 100;
        if (progress >= 100) status = "Tercapai";
        else if (progress >= 80) status = "Perlu Perhatian";
      } else if (targetTahunan > 0) {
        progress = 0;
        status = "Belum Tercapai";
      }

      return {
        ...ind,
        targetValue,
        realisasiValue,
        progress,
        statusStr: status,
      };
    });
  }, [data, filterTahun, filterPeriode, filterPilar]);

  // Aggregations
  const totalIndicators = processedData.length;
  const tercapaiCount = processedData.filter(d => d.statusStr === "Tercapai").length;
  const perluPerhatianCount = processedData.filter(d => d.statusStr === "Perlu Perhatian").length;
  const belumTercapaiCount = processedData.filter(d => d.statusStr === "Belum Tercapai").length;
  const avgProgress = totalIndicators > 0 ? processedData.reduce((sum, d) => sum + d.progress, 0) / totalIndicators : 0;

  // Grafik Perbandingan Tahun
  const perbandinganTahunData = useMemo(() => {
    const pilarsList = pilarKpi.map(p => p.name);
    return pilarsList.map(pName => {
      const pData = data.filter(d => d.pilar === pName);
      let currRealisasi = 0, currTarget = 0;
      let prevRealisasi = 0, prevTarget = 0;

      pData.forEach(ind => {
         const tTahunan = Number(ind.target_tahunan || 0);
         currTarget += tTahunan;
         prevTarget += tTahunan;
         
         currRealisasi += (ind.capaian_kpi || []).filter((c: any) => c.tahun === compareYear2).reduce((s: number, c: any) => s + Number(c.realisasi||0), 0);
         prevRealisasi += (ind.capaian_kpi || []).filter((c: any) => c.tahun === compareYear1).reduce((s: number, c: any) => s + Number(c.realisasi||0), 0);
      });

      return {
        name: pName,
        [compareYear2]: currTarget > 0 ? Math.min(100, (currRealisasi/currTarget)*100) : 0,
        [compareYear1]: prevTarget > 0 ? Math.min(100, (prevRealisasi/prevTarget)*100) : 0,
      }
    });
  }, [data, compareYear1, compareYear2]);

  // Grafik Tren Bulanan
  const trenBulananData = useMemo(() => {
    return MONTHS.map((m, idx) => {
       const bulan = idx + 1;
       let totalProgress = 0;
       
       processedData.forEach(ind => {
         const capaian = ind.capaian_kpi?.find((c: any) => c.tahun === filterTahun && c.bulan === bulan);
         let targetBulanan = 0;
         if (capaian && capaian.target_bulanan !== null && capaian.target_bulanan !== undefined) {
           targetBulanan = Number(capaian.target_bulanan);
         } else {
           targetBulanan = Number(ind.target_tahunan || 0) / 12;
         }
         let realisasiBulanan = capaian ? Number(capaian.realisasi || 0) : 0;

         let progress = 0;
         if (targetBulanan > 0) {
           progress = (realisasiBulanan / targetBulanan) * 100;
           if (progress > 100) progress = 100;
         }
         totalProgress += progress;
       });

       return {
         name: m,
         capaian: processedData.length > 0 ? totalProgress / processedData.length : 0
       }
    });
  }, [processedData, filterTahun]);

  // Target vs Realisasi & Capaian Pilar
  const pilarCapaianData = useMemo(() => {
    const pilarsList = pilarKpi.map(p => p.name).filter(p => filterPilar === "Semua" || p === filterPilar);
    return pilarsList.map(pName => {
      const inds = processedData.filter(d => d.pilar === pName);
      const totalT = inds.reduce((s, d) => s + d.targetValue, 0);
      const totalR = inds.reduce((s, d) => s + d.realisasiValue, 0);
      const prog = totalT > 0 ? Math.min(100, (totalR/totalT)*100) : 0;
      return {
        name: pName,
        target: totalT,
        realisasi: totalR,
        progress: prog
      };
    });
  }, [processedData, filterPilar]);

  // Status KPI Data
  const statusKpiData = [
    { name: 'Tercapai', value: tercapaiCount, color: '#10B981' },
    { name: 'Perlu Perhatian', value: perluPerhatianCount, color: '#F59E0B' },
    { name: 'Belum Tercapai', value: belumTercapaiCount, color: '#EF4444' }
  ];

  // Executive Summary Text
  const summaryText = useMemo(() => {
    if (processedData.length === 0) return "Belum ada data indikator pada periode ini.";
    const bestPilar = pilarCapaianData.reduce((prev, curr) => (curr.progress > prev.progress) ? curr : prev, {name: '', progress: -1});
    const worstPilar = pilarCapaianData.reduce((prev, curr) => (curr.progress < prev.progress) ? curr : prev, {name: '', progress: 101});
    
    return `Pada periode yang dipilih, rata-rata capaian KPI Rumah Sakit mencapai ${avgProgress.toFixed(0)}%. Sebanyak ${tercapaiCount} dari ${totalIndicators} indikator telah mencapai target. ${bestPilar.name} memiliki capaian tertinggi (${bestPilar.progress.toFixed(0)}%), sedangkan ${worstPilar.name} memerlukan perhatian lebih karena masih berada di persentase terendah (${worstPilar.progress.toFixed(0)}%).`;
  }, [avgProgress, tercapaiCount, totalIndicators, pilarCapaianData, processedData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 rounded-full border-4 border-primary-cyan opacity-20 border-t-primary-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins text-white tracking-tight flex items-center gap-2">
            GRAFIK ANALITIK KPI
          </h1>
          <p className="text-gray-400 mt-1">Pusat analisis kinerja KPI rumah sakit secara menyeluruh</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 md:justify-end flex-1">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-cyan to-primary-purple rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-[#0f172a] rounded-xl px-4 py-2 border border-white/10">
              <Calendar className="w-4 h-4 text-primary-cyan mr-3" />
              <select 
                value={filterTahun} onChange={(e) => setFilterTahun(Number(e.target.value))}
                className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none pr-4 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-dark-navy">{y}</option>)}
              </select>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-cyan to-primary-purple rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-[#0f172a] rounded-xl px-4 py-2 border border-white/10">
              <Filter className="w-4 h-4 text-primary-purple mr-3" />
              <select 
                value={filterPeriode} onChange={(e) => setFilterPeriode(e.target.value)}
                className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none pr-4 cursor-pointer max-w-[120px]"
              >
                <option value="Tahunan" className="bg-dark-navy">Tahunan</option>
                <option value="Semester 1" className="bg-dark-navy">Semester I</option>
                <option value="Semester 2" className="bg-dark-navy">Semester II</option>
                <option value="Q1" className="bg-dark-navy">Triwulan I</option>
                <option value="Q2" className="bg-dark-navy">Triwulan II</option>
                <option value="Q3" className="bg-dark-navy">Triwulan III</option>
                <option value="Q4" className="bg-dark-navy">Triwulan IV</option>
                {MONTHS.map((m, idx) => (
                  <option key={idx+1} value={idx+1} className="bg-dark-navy">{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-cyan to-primary-purple rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-[#0f172a] rounded-xl px-4 py-2 border border-white/10">
              <LayoutGrid className="w-4 h-4 text-primary-gold mr-3" />
              <select 
                value={filterPilar} onChange={(e) => setFilterPilar(e.target.value)}
                className="bg-transparent text-white text-sm font-medium focus:outline-none appearance-none pr-4 cursor-pointer max-w-[150px]"
              >
                <option value="Semua" className="bg-dark-navy">Semua Pilar</option>
                {pilarKpi.map(p => (
                  <option key={p.id} value={p.name} className="bg-dark-navy">{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary-cyan/20 via-dark-navy to-dark-charcoal border border-primary-cyan/30 shadow-[0_8px_32px_rgba(6,182,212,0.15)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-cyan/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-cyan" /> Analisis KPI
          </h3>
          <button 
            onClick={async () => {
              if (isEditingSummary) {
                setSavedSummaryText(customSummaryText);
                setIsEditingSummary(false);
                
                // Always save to localStorage as fallback
                localStorage.setItem(`summary_${filterTahun}_${filterPeriode}`, customSummaryText);
                
                if (isSupabaseConfigured()) {
                  try {
                    await saveDashboardSummaryText(filterTahun, filterPeriode, customSummaryText);
                  } catch (e) {
                    console.error("Failed to save summary to Supabase:", e);
                  }
                }
              } else {
                setCustomSummaryText(savedSummaryText || summaryText);
                setIsEditingSummary(true);
              }
            }}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
            title={isEditingSummary ? "Simpan Analisis" : "Edit Analisis"}
          >
            {isEditingSummary ? <Check className="w-4 h-4 text-primary-green" /> : <Edit2 className="w-4 h-4" />}
          </button>
        </div>
        
        {isEditingSummary ? (
          <textarea
            value={customSummaryText}
            onChange={(e) => setCustomSummaryText(e.target.value)}
            className="w-full bg-dark-charcoal/50 border border-white/20 rounded-lg p-3 text-sm md:text-base text-gray-200 focus:outline-none focus:border-primary-cyan relative z-10 min-h-[100px] resize-y"
          />
        ) : (
          <p className="text-gray-200 leading-relaxed text-sm md:text-base relative z-10 text-justify">
            {savedSummaryText || summaryText}
          </p>
        )}
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Rata-rata Capaian" value={`${avgProgress.toFixed(0)}%`} icon={<TrendingUp />} color="text-primary-cyan" border="border-primary-cyan/30" />
        <StatCard title="Total Indikator" value={totalIndicators.toString()} icon={<Target />} color="text-primary-purple" border="border-primary-purple/30" />
        <StatCard title="Tercapai (100%)" value={tercapaiCount.toString()} icon={<CheckCircle2 />} color="text-primary-green" border="border-primary-green/30" />
        <StatCard title="Perlu Perhatian (<100%)" value={(perluPerhatianCount + belumTercapaiCount).toString()} icon={<AlertTriangle />} color="text-primary-gold" border="border-primary-gold/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Perbandingan Tahun */}
        <div className="p-6 rounded-2xl glassmorphism border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white font-poppins flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-purple" /> Perbandingan Tahun
            </h3>
            <div className="flex items-center gap-2">
              <select 
                value={compareYear1} onChange={(e) => setCompareYear1(Number(e.target.value))}
                className="bg-dark-navy/80 border border-white/10 text-white rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:border-primary-cyan"
              >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-gray-500 text-xs">vs</span>
              <select 
                value={compareYear2} onChange={(e) => setCompareYear2(Number(e.target.value))}
                className="bg-dark-navy/80 border border-white/10 text-white rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:border-primary-cyan"
              >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perbandinganTahunData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tick={<CustomXAxisTick />} interval={0} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  cursor={{fill: '#1E293B', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => [`${value.toFixed(0)}%`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', height: '18px', padding: 0, margin: '0 0 -20px 0' }} />
                <Bar dataKey={compareYear1} name={compareYear1.toString()} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey={compareYear2} name={compareYear2.toString()} fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik Tren Bulanan */}
        <div className="p-6 rounded-2xl glassmorphism border border-white/5">
          <h3 className="font-semibold text-white mb-6 font-poppins flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-cyan" /> Tren Capaian Bulanan {filterTahun}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trenBulananData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => [`${value.toFixed(0)}%`, '']}
                />
                <Line type="monotone" dataKey="capaian" name="Capaian (%)" stroke="#06B6D4" strokeWidth={3} dot={{r: 4, fill: '#06B6D4', strokeWidth: 2, stroke: '#0f172a'}} activeDot={{r: 6}} style={{ filter: 'drop-shadow(0px 4px 6px rgba(6,182,212,0.4))' }}>
                  <LabelList dataKey="capaian" position="top" fill="#94A3B8" fontSize={10} formatter={(val: number) => val > 0 ? `${val.toFixed(0)}%` : ''} offset={10} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik Capaian per Pilar */}
        <div className="p-6 rounded-2xl glassmorphism border border-white/5 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white font-poppins flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-pink" /> Capaian per Pilar
            </h3>
            <div className="flex bg-[#0f172a] rounded-lg p-1 border border-white/10 shadow-lg">
              <button onClick={() => setCapaianChartType('bar')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${capaianChartType === 'bar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>Bar</button>
              <button onClick={() => setCapaianChartType('line')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${capaianChartType === 'line' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>Line</button>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              {capaianChartType === 'bar' ? (
                <BarChart data={pilarCapaianData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} tick={<CustomXAxisTick />} interval={0} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{fill: '#1E293B', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [`${value.toFixed(0)}%`, '']}
                  />
                  <Bar dataKey="progress" name="Capaian (%)" radius={[4, 4, 0, 0]}>
                    {pilarCapaianData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <LabelList dataKey="progress" position="top" fill="#E2E8F0" fontSize={11} formatter={(val: number) => `${val.toFixed(0)}%`} />
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={pilarCapaianData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} tick={<CustomXAxisTick />} interval={0} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [`${value.toFixed(0)}%`, '']}
                  />
                  <Line type="monotone" dataKey="progress" name="Capaian (%)" stroke="#8B5CF6" strokeWidth={3} dot={{r: 5, fill: '#8B5CF6', strokeWidth: 2, stroke: '#0f172a'}} activeDot={{r: 7}}>
                    <LabelList dataKey="progress" position="top" fill="#E2E8F0" fontSize={11} formatter={(val: number) => `${val.toFixed(0)}%`} offset={15} />
                  </Line>
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status KPI Donut */}
        <div className="p-6 rounded-2xl glassmorphism border border-white/5 lg:col-span-2">
          <h3 className="font-semibold text-white mb-6 font-poppins flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary-cyan" /> Status KPI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusKpiData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {statusKpiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#E2E8F0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-4">
                <span className="text-3xl font-bold text-white">{totalIndicators}</span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Indikator</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {statusKpiData.map((item, idx) => {
                const percentage = totalIndicators > 0 ? (item.value / totalIndicators) * 100 : 0;
                return (
                  <div key={idx} className="p-4 rounded-xl bg-dark-charcoal/50 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-gray-400">
                          {item.name === 'Tercapai' ? 'Capaian 100%' : item.name === 'Perlu Perhatian' ? 'Capaian 80% - 99%' : 'Capaian < 80%'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white font-mono">{item.value}</p>
                      <p className="text-xs text-primary-cyan font-semibold font-mono">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, border }: { title: string, value: string, icon: React.ReactNode, color: string, border: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`p-5 rounded-2xl bg-dark-navy/80 border ${border} flex flex-col items-center justify-center text-center group cursor-default transition-all shadow-lg backdrop-blur-sm relative overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`mb-3 p-3 rounded-xl bg-dark-charcoal border border-white/5 ${color} shadow-inner relative z-10`}>
        {icon}
      </div>
      <h4 className="text-2xl font-bold text-white mb-1 font-poppins relative z-10">{value}</h4>
      <p className="text-xs text-gray-400 capitalize relative z-10 font-medium">{title}</p>
    </motion.div>
  );
}
