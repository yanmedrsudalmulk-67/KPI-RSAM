"use client";

import { useEffect, useState } from "react";
import { pilarKpi } from "@/lib/data";
import { ArrowRight, ArrowUpRight, ArrowDownRight, Activity, Database, AlertCircle, Copy, Check, ChevronDown, X, BarChart2, LineChart as LineChartIcon } from "lucide-react";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, BarChart, Bar, Legend, LabelList, Cell } from "recharts";
import { getDashboardSummary, PilarKPI } from "@/lib/services/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { EffectCoverflow, Pagination, Navigation, Autoplay } from "swiper/modules";

export default function DashboardPage() {
  const [pilars, setPilars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      // Fetch slider images
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data } = await supabase.from("settings").select("logo_url").eq("id", 1).maybeSingle();
          if (data && data.logo_url && data.logo_url.startsWith("{")) {
            const parsed = JSON.parse(data.logo_url);
            if (parsed.slider_images && Array.isArray(parsed.slider_images)) {
              setSliderImages(parsed.slider_images);
            }
          }
        } catch (e) {
          console.warn("Failed to load slider images:", e);
        }
      }

      if (!isSupabaseConfigured()) {
        setPilars(pilarKpi.map((p, i) => ({
          ...p,
          nama_pilar: p.name,
          progress: Math.floor(Math.random() * 50) + 50,
          status: 'Belum tercapai',
          count: 5
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
            progress: 0,
            status: 'Belum tercapai',
            count: 0
          })));
        }
      } catch (error: any) {
        if (error?.code !== 'PGRST205') {
          console.error("Error loading pilars", error);
        }
        setPilars(pilarKpi.map(p => ({
          ...p,
          nama_pilar: p.name,
          progress: 0,
          status: 'Belum tercapai',
          count: 0
        })));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tahun, bulan]);

  const MONTH_OPTIONS = [
    { value: 0, label: "Tahunan" },
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" }
  ];

  const chartData = pilars.map(p => {
    let barColor = "#06B6D4"; // default cyan
    if (p.nama_pilar.includes("PILAR 1")) barColor = "#3b82f6";
    else if (p.nama_pilar.includes("PILAR 2")) barColor = "#22c55e";
    else if (p.nama_pilar.includes("PILAR 3")) barColor = "#f59e0b";
    else if (p.nama_pilar.includes("PILAR 4")) barColor = "#a855f7";
    else if (p.nama_pilar.includes("PILAR 5")) barColor = "#ef4444";
    else if (p.nama_pilar.includes("PILAR 6")) barColor = "#2dd4bf";
    else if (p.nama_pilar.includes("PILAR 7")) barColor = "#818cf8";

    return {
      name: `Pilar ${p.id}`,
      progress: p.progress || 0,
      target: 100,
      color: barColor
    };
  });
  
  const selectedMonthName = MONTH_OPTIONS.find(m => m.value === bulan)?.label.toUpperCase();
  const chartTitle = `PERIODE ${bulan === 0 ? "TAHUNAN" : selectedMonthName} ${tahun}`;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-poppins bg-gradient-to-r from-blue-400 via-primary-purple to-primary-pink bg-clip-text text-transparent tracking-tight animate-shimmer">DASHBOARD MONITORING KPI</h1>
          <p className="text-gray-400 mt-1">Pusat Monitoring Indikator Kinerja Rumah Sakit</p>
        </div>
        
        {/* Animated Border Container */}
        <div className="relative p-[2px] rounded-full overflow-hidden group w-max">
          {/* Rotating gradient background */}
          <div className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#4facfe_25%,#f093fb_50%,#f5576c_75%,transparent_100%)] opacity-80" />
          
          <div className="relative overflow-hidden flex items-center bg-[#0b1120] rounded-full p-2.5 px-7 w-max backdrop-blur-xl z-10 transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            {/* Glass glare highlight line */}
            <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-full" />
            
            {/* Segment 1: Bulan */}
            <div className="relative flex items-center pr-5 text-white font-medium text-sm cursor-pointer hover:opacity-80 transition-opacity z-10">
              <select 
                value={bulan}
                onChange={(e) => setBulan(parseInt(e.target.value))}
                className="bg-transparent text-white pr-6 appearance-none focus:outline-none cursor-pointer font-semibold text-sm tracking-wide"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-[#0f172a] text-white">
                    {m.value === 0 ? m.label : m.label.substring(0, 3)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-white/70 absolute right-0 pointer-events-none" />
            </div>

            {/* Divider */}
            <div className="w-[1px] h-6 bg-white/10 z-10" />

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
      </div>

      {loading && isSupabaseConfigured() && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-primary-purple opacity-20 border-t-primary-purple animate-spin" />
        </div>
      )}

      {/* Slider Area */}
      {sliderImages && sliderImages.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden py-4 -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full">
          <Swiper
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={"auto"}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 100,
              modifier: 2.5,
              slideShadows: true,
            }}
            loop={true}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{ clickable: true, dynamicBullets: true }}
            modules={[EffectCoverflow, Pagination, Autoplay]}
            className="w-full h-full pb-8"
            observer={true}
            observeParents={true}
          >
            {/* Duplicate images if less than 5 to ensure smooth infinite loop */}
            {(sliderImages.length < 5 
              ? [...sliderImages, ...sliderImages, ...sliderImages, ...sliderImages].slice(0, Math.max(5, sliderImages.length * 2))
              : sliderImages
            ).map((src, index) => (
              <SwiperSlide key={`${src}-${index}`} className="max-w-[85%] sm:max-w-[70%] md:max-w-[60%] lg:max-w-[50%]">
                <div 
                  className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 cursor-pointer group"
                  onClick={() => setLightboxImage(src)}
                >
                  <img
                    src={src}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle vignette/overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* 7 Pilar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pilars.map((pilar, index) => (
          <div key={pilar.id} className={`p-6 rounded-2xl glassmorphism group relative overflow-hidden flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-white/20 ${index === 6 ? 'md:col-span-2 lg:col-span-1 lg:col-start-2' : ''}`}
               style={{ animationDelay: `${index * 100}ms` }}
          >
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
              
              <Link href={`/dashboard/pilar/${pilar.id}?tahun=${tahun}&bulan=${bulan}`} className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors w-max relative z-10">
                Lihat Detail <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* Colored Bottom Border */}
            <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r ${pilar.color} opacity-70 z-20 rounded-b-2xl`} />
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-white mb-6 font-poppins flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-cyan" /> 
          GRAFIK CAPAIAN KPI PER PILAR
        </h2>
        
        <div className="p-6 rounded-2xl glassmorphism">
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1" />
            <h3 className="font-poppins font-bold text-gray-200 text-base md:text-lg text-center tracking-wide flex-1">
              {chartTitle}
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 justify-end">
              <div className="flex bg-[#0f172a] rounded-lg p-1 border border-white/10 w-auto shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                <button
                  onClick={() => setChartType('bar')}
                  className={`p-2 rounded-md transition-colors ${chartType === 'bar' ? 'bg-primary-cyan/20 text-primary-cyan' : 'text-gray-400 hover:text-white'}`}
                  title="Grafik Batang"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`p-2 rounded-md transition-colors ${chartType === 'line' ? 'bg-primary-purple/20 text-primary-purple' : 'text-gray-400 hover:text-white'}`}
                  title="Grafik Garis"
                >
                  <LineChartIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickMargin={20} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{fill: '#1E293B', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  
                  <Bar dataKey="target" name="Target (100%)" fill="#334155" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="target" position="top" fill="#94A3B8" fontSize={11} formatter={(val: number) => `${val}%`} />
                  </Bar>
                  <Bar dataKey="progress" name="Capaian" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0px 6px 8px rgba(0,0,0,0.4))' }} />
                    ))}
                    <LabelList dataKey="progress" position="top" fill="#22D3EE" fontSize={11} formatter={(val: number) => `${val}%`} />
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickMargin={20} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  
                  <Line type="monotone" dataKey="target" name="Target (100%)" stroke="#64748B" strokeWidth={2} strokeDasharray="5 5" dot={{r: 4, fill: '#0f172a', strokeWidth: 2}}>
                    <LabelList dataKey="target" position="top" fill="#94A3B8" fontSize={11} formatter={(val: number) => `${val}%`} offset={10} />
                  </Line>
                  <Line type="monotone" dataKey="progress" name="Capaian" stroke="#06B6D4" strokeWidth={3} dot={{r: 5, fill: '#06B6D4', strokeWidth: 2, stroke: '#0f172a'}} activeDot={{r: 7, fill: '#06B6D4', strokeWidth: 0}} style={{ filter: 'drop-shadow(0px 8px 12px rgba(6,182,212,0.4))' }}>
                    <LabelList dataKey="progress" position="bottom" fill="#22D3EE" fontSize={11} formatter={(val: number) => `${val}%`} offset={15} />
                  </Line>
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer" onClick={() => setLightboxImage(null)}></div>
          <div className="relative z-10 max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button 
              className="absolute -top-12 right-0 p-2 text-white hover:text-red-400 bg-black/50 hover:bg-black/80 rounded-full transition-colors z-20" 
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Fullscreen Slider"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
