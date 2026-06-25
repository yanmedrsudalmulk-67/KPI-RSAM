"use client";

import { useEffect, useState } from "react";
import { pilarKpi } from "@/lib/data";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Activity, Target, AlertTriangle, TrendingUp, Medal, AlertCircle } from "lucide-react";
import { getPilars, PilarKPI } from "@/lib/services/api";
import { isSupabaseConfigured } from "@/lib/supabase";

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#10B981', '#3B82F6', '#EF4444'];

const statusData = [
  { name: 'Tercapai (>100%)', value: 45, color: '#10B981' },
  { name: 'Perlu Perhatian (80-99%)', value: 12, color: '#F59E0B' },
  { name: 'Belum Tercapai (<80%)', value: 5, color: '#EF4444' }
];

export default function GrafikPage() {
  const [pilars, setPilars] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      let isMock = !isSupabaseConfigured();
      if (isSupabaseConfigured()) {
        try {
          const data = await getPilars();
          // Mock progress for charts
          const graphPilars = data.map(p => ({
            ...p,
            progress: Math.floor(Math.random() * 50) + 50 // placeholder progress
          }));
          setPilars(graphPilars);
        } catch(e) {
          isMock = true;
        }
      } 
      
      if (isMock) {
        setPilars(pilarKpi.map(p => ({
            ...p,
            nama_pilar: p.name
        })));
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-poppins text-white tracking-tight">ANALITIK & GRAFIK</h1>
        <p className="text-gray-400 mt-1">Dashboard analitik komprehensif capaian KPI rumah sakit</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Indikator" value="62" icon={<Target />} color="text-primary-cyan" />
        <StatCard title="Total Indikator Tercapai" value="45" icon={<TrendingUp />} color="text-primary-green" />
        <StatCard title="Belum Tercapai" value="5" icon={<AlertTriangle />} color="text-primary-pink" />
        <StatCard title="Rata-rata KPI RS" value="84.5%" icon={<Activity />} color="text-primary-purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="p-6 rounded-2xl glassmorphism">
          <h3 className="font-semibold text-white mb-6">Proporsi Status Capaian</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#E2E8F0' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl glassmorphism">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white">Ranking Rata-rata Capaian per Pilar</h3>
            <div className="p-1.5 rounded-lg bg-primary-gold/20 text-primary-gold">
              <Medal className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pilars.sort((a,b) => b.progress - a.progress)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="nama_pilar" type="category" stroke="#E2E8F0" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{fill: '#1E293B', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Bar dataKey="progress" fill="#8B5CF6" radius={[0, 4, 4, 0]}>
                  {
                    pilars.sort((a,b) => b.progress - a.progress).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="p-5 rounded-2xl glassmorphism flex flex-col items-center justify-center text-center group cursor-default hover:bg-white/5 transition-colors">
      <div className={`mb-3 p-3 rounded-full bg-dark-charcoal border border-white/5 ${color} shadow-inner`}>
        {icon}
      </div>
      <h4 className="text-2xl font-bold text-white mb-1">{value}</h4>
      <p className="text-xs text-gray-400 capitalize">{title}</p>
    </div>
  );
}
