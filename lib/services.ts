import { supabase } from './supabase';
import { pilarKpi as mockPilar, indicators as mockIndicators } from './data';

const isSupabaseConfigured = () => {
  return !!supabase;
};

export const fetchPilarKpi = async () => {
  if (!isSupabaseConfigured()) return mockPilar;
  
  const { data, error } = await supabase!.from('pilar_kpi').select('*');
  if (error || !data) {
    console.error('Error fetching Pilar KPI:', error);
    return mockPilar;
  }
  
  return data.map((item: any) => ({
    id: item.id,
    name: item.nama_pilar,
    count: 0,
    avg: 0,
    color: item.warna_card || 'from-blue-500 to-blue-700',
    status: 'Tercapai',
    trend: 'up',
    progress: 0
  }));
};

export const fetchIndicators = async (pilarId?: number) => {
  if (!isSupabaseConfigured()) {
    return pilarId ? mockIndicators.filter(i => i.pilarId === pilarId) : mockIndicators;
  }
  
  let query = supabase!.from('indikator_kpi').select(`
    *,
    capaian_kpi (*)
  `);
  
  if (pilarId) {
    query = query.eq('pilar_id', pilarId);
  }
  
  const { data, error } = await query;
  if (error || !data) {
    console.error('Error fetching indicators:', error);
    return mockIndicators;
  }
  
  return data.map((item: any) => ({
    id: item.id,
    pilarId: item.pilar_id,
    name: item.nama_indikator,
    target: item.target,
    realisasi: 0,
    capaian: 0,
    status: 'Belum diisi',
    trend: 'up',
    periode: 'Bulan Ini'
  }));
};

export const saveCapaian = async (payload: any) => {
  if (!isSupabaseConfigured()) {
    console.log('Mock save:', payload);
    return { success: true };
  }
  
  const { data, error } = await supabase!.from('capaian_kpi').insert([payload]);
  if (error) {
    console.error('Error saving capaian:', error);
    return { success: false, error };
  }
  return { success: true, data };
};
