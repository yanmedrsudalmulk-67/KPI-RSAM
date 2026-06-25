"use client";

import { Database, Plus, Search, Edit3, Trash2, Filter } from "lucide-react";
import { useState } from "react";

const tabs = ["Pilar KPI", "Indikator KPI", "Unit Kerja", "Pengguna (User)"];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState("Pilar KPI");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins text-white tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-primary-gold" /> MASTER DATA
          </h1>
          <p className="text-gray-400 mt-1">Kelola data referensi utama sistem KPI</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-purple to-primary-pink rounded-xl text-white font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" /> Tambah Data
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab 
                ? "bg-primary-purple text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                : "bg-dark-charcoal text-gray-400 hover:text-white hover:bg-white/5 border border-white/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6 rounded-2xl glassmorphism min-h-[400px]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-white">Data {activeTab}</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder={`Cari ${activeTab.toLowerCase()}...`}
                className="w-full pl-9 pr-4 py-2 bg-dark-navy border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary-purple transition-colors"
              />
            </div>
            <button className="p-2 bg-dark-navy border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-dark-navy/50 text-gray-400 text-xs uppercase font-medium">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">No</th>
                <th className="px-4 py-3">Nama Lengkap / Deskripsi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tgl. Dibuat</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[1,2,3,4,5].map((item) => (
                <tr key={item} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">{item}</td>
                  <td className="px-4 py-4 font-medium text-white">Data Sample {item} untuk {activeTab}</td>
                  <td className="px-4 py-4">
                    <span className="inline-block px-3 py-1 text-xs rounded-full bg-primary-green/10 text-primary-green relative">
                      Aktif
                    </span>
                  </td>
                  <td className="px-4 py-4">12 Jun 2026</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 transition-colors">
                        <Edit3 className="w-4 h-4" />
                       </button>
                       <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
