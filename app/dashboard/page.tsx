"use client";

import { useEffect, useState } from "react";
import { chartData, pilarKpi } from "@/lib/data";
import { ArrowRight, ArrowUpRight, ArrowDownRight, Activity, Database, AlertCircle, Copy, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, BarChart, Bar, Legend } from "recharts";
import { getDashboardSummary, PilarKPI } from "@/lib/services/api";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function DashboardPage() {
  const [pilars, setPilars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (!isSupabaseConfigured()) {
        setPilars(pilarKpi.map(p => ({
          ...p,
          nama_pilar: p.name,
        })));
        setLoading(false);
        return;
      }
      try {
        const data = await getDashboardSummary(tahun, bulan);
        if (data && data.length > 0) {
          setPilars(data);
        } else {
          // If Supabase returns empty (table exists but no seed data)
          setPilars(pilarKpi.map(p => ({
            ...p,
            nama_pilar: p.name,
          })));
        }
      } catch (error: any) {
        if (error?.code !== 'PGRST205') {
          console.error("Error loading pilars", error);
        }
        setPilars(pilarKpi.map(p => ({
          ...p,
          nama_pilar: p.name,
        })));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tahun, bulan]);

  const MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-poppins bg-gradient-to-r from-blue-400 via-primary-purple to-primary-pink bg-clip-text text-transparent tracking-tight animate-shimmer">DASHBOARD MONITORING KPI</h1>
          <p className="text-gray-400 mt-1">Pusat Monitoring Indikator Kinerja Rumah Sakit</p>
        </div>
        
        <div className="relative overflow-hidden flex items-center glossy-glass rounded-full p-2.5 px-7 w-max transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(99,102,241,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]">
          {/* Glass glare highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-full" />
          
          {/* Accent light shine reflection */}
          <div className="absolute -left-1/4 -top-1/2 w-1/2 h-[200%] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent rotate-12 pointer-events-none" />

          {/* Segment 1: Bulan */}
          <div className="relative flex items-center pr-5 text-white font-medium text-sm cursor-pointer hover:opacity-80 transition-opacity z-10">
            <select 
              value={bulan}
              onChange={(e) => setBulan(parseInt(e.target.value))}
              className="bg-transparent text-white pr-6 appearance-none focus:outline-none cursor-pointer font-semibold text-sm tracking-wide"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-[#0f172a] text-white">
                  {m.substring(0, 3)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-white/70 absolute right-0 pointer-events-none" />
          </div>

          {/* Divider */}
          <div className="w-[1px] h-6 bg-indigo-500/30 z-10" />

          {/* Segment 2: Tahun */}
          <div className="relative flex items-center pl-5 text-white font-medium text-sm cursor-pointer hover:opacity-80 transition-opacity z-10">
            <select 
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
              className="bg-transparent text-white pr-6 appearance-none focus:outline-none cursor-pointer font-semibold text-sm tracking-wide"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-[#0f172a] text-white">
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-white/70 absolute right-0 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading && isSupabaseConfigured() && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-primary-purple opacity-20 border-t-primary-purple animate-spin" />
        </div>
      )}

      {/* 7 Pilar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pilars.map((pilar, index) => (
          <div key={pilar.id} className={`p-6 rounded-2xl glassmorphism group relative overflow-hidden flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-white/20 ${index === 6 ? 'md:col-span-2 lg:col-span-1 lg:col-start-2' : ''}`}
               style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${pilar.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold tracking-wider uppercase text-gray-400">PILAR {pilar.id}</span>
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  pilar.status === 'Tercapai' ? 'bg-primary-green/10 text-primary-green' : 
                  pilar.status === 'Perlu perhatian' ? 'bg-primary-gold/10 text-primary-gold' : 
                  'bg-primary-pink/10 text-primary-pink'
                }`}>
                  {pilar.status}
                </span>
              </div>
              <h3 className={`${pilar.id === 6 ? 'text-[15px]' : 'text-[20px]'} font-bold text-white mb-1 font-poppins not-italic`}>
                {pilar.id === 6 ? (
                  <>
                    IKU, PROGRAM UNGGULAN <br />
                    DAN PROGRAM PRIORITAS LAINNYA
                  </>
                ) : (
                  pilar.nama_pilar.replace(/^PILAR\s+\d+\s*-\s*/i, '')
                )}
              </h3>
              <p className="text-sm text-gray-400 mb-6">{pilar.count} Indikator</p>
            </div>

            <div>
              <div className="flex items-end justify-between mb-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-400">Capaian KPI</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[35px] italic font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent leading-none">
                      {pilar.progress}%
                    </span>
                    {pilar.trend === 'up' ? 
                      <ArrowUpRight className="w-4 h-4 text-primary-green" /> : 
                      <ArrowDownRight className="w-4 h-4 text-primary-pink" />
                    }
                  </div>
                </div>
              </div>
              
              <div className="w-full h-1.5 bg-dark-navy rounded-full overflow-hidden mb-4">
                <div className={`h-full rounded-full bg-gradient-to-r ${pilar.color}`} style={{ width: `${pilar.progress}%` }} />
              </div>
              
              <Link href={`/dashboard/pilar/${pilar.id}`} className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors w-max relative z-10">
                Lihat Detail <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* Glowing Bottom Line Effect */}
            <div className={`absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r ${pilar.color} z-20`} />
            <div className={`absolute bottom-0 left-0 w-full h-[15px] bg-gradient-to-r ${pilar.color} blur-xl opacity-60 z-0 translate-y-1`} />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-white mb-6 font-poppins flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-cyan" /> 
          GRAFIK CAPAIAN KPI
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl glassmorphism lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-semibold text-gray-200">Perkembangan KPI (Tahun Berjalan)</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#E2E8F0' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Area type="monotone" dataKey="realisasi" name="Realisasi" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorRealisasi)" />
                  <Area type="monotone" dataKey="target" name="Target" stroke="#64748B" strokeDasharray="5 5" fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl glassmorphism">
             <div className="mb-6">
              <h3 className="font-semibold text-gray-200">Target vs Realisasi Bulanan</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: '#1E293B', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Bar dataKey="target" name="Target" fill="#334155" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realisasi" name="Realisasi" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-2xl glassmorphism">
             <div className="mb-6">
              <h3 className="font-semibold text-gray-200">Trend Capaian Historis</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Line type="monotone" dataKey="realisasi" name="Capaian %" stroke="#F59E0B" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
