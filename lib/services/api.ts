import { supabase, isSupabaseConfigured } from '../supabase';

export interface PilarKPI {
  id: number;
  nama_pilar: string;
  deskripsi: string;
}

export interface IndikatorKPI {
  id: number;
  pilar_id: number;
  nama_indikator: string;
  satuan: string;
  target_tahunan: number;
  keterangan: string;
}

export interface CapaianKPI {
  id: number;
  indikator_id: number;
  bulan: number;
  tahun: number;
  realisasi: number;
  persentase: number;
  status: string;
  dokumen_url?: string;
}

export async function getPilars() {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase is not configured.");
    return [];
  }
  const { data, error } = await supabase!.from('pilar_kpi').select('*').order('id', { ascending: true });
  if (error) throw error;
  return data as PilarKPI[];
}

export async function getIndicatorsByPilar(pilarId: number) {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const { data, error } = await supabase!.from('indikator_kpi').select('*').eq('pilar_id', pilarId).order('id', { ascending: true });
  if (error) throw error;
  return data as IndikatorKPI[];
}

export async function getPilarDetail(pilarId: number) {
  if (!isSupabaseConfigured()) return { pilar: null, indicators: [] };
  
  const { data: pilar, error: err1 } = await supabase!.from('pilar_kpi').select('*').eq('id', pilarId).maybeSingle();
  if (err1) throw err1;
  if (!pilar) return { pilar: null, indicators: [] };

  const { data: indicators, error: err2 } = await supabase!.from('indikator_kpi').select('*, capaian_kpi(*)').eq('pilar_id', pilarId);
  if (err2) throw err2;

  // Process indicators to extract latest capaian (just using the highest id for now or latest month/year)
  const processed = indicators.map(ind => {
    let latestCapaian = null;
    let totalRealisasi = 0;
    if (ind.capaian_kpi && ind.capaian_kpi.length > 0) {
      // Sort by tahun desc, bulan desc
      const sorted = ind.capaian_kpi.sort((a: any, b: any) => {
        if (a.tahun !== b.tahun) return b.tahun - a.tahun;
        return b.bulan - a.bulan;
      });
      latestCapaian = sorted[0];
      totalRealisasi = ind.capaian_kpi.reduce((sum: number, c: any) => sum + Number(c.realisasi), 0);
    }

    let progress = 0;
    let status = "Belum tercapai";
    if (ind.target_tahunan > 0) {
       progress = (totalRealisasi / ind.target_tahunan) * 100;
       if (progress >= 100) status = "Tercapai";
       else if (progress >= 80) status = "Perlu perhatian";
    }

    return {
      ...ind,
      latestCapaian,
      totalRealisasi,
      progress,
      status
    };
  });

  return { pilar, indicators: processed };
}
export async function getIndicators() {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const { data, error } = await supabase!.from('indikator_kpi').select('*, pilar_kpi(*)').order('id', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getDashboardSummary(tahun: number, bulan: number) {
  if (!isSupabaseConfigured()) {
    throw new Error("PGRST205"); // Simulate DB error to fallback
  }

  // Fetch all indicators with their capaians
  const { data: indicators, error: errInd } = await supabase!.from('indikator_kpi').select('*, capaian_kpi(*)');
  if (errInd) throw errInd;

  // Derive pilars from indicators
  const pilarNames = [...new Set(indicators.map(i => i.pilar))];
  const pilars = pilarNames.map((name, index) => ({
    id: index + 1,
    nama_pilar: name || `PILAR ${index + 1}`
  }));

  const result = pilars.map((pilar) => {
    const pilarIndicators = indicators.filter(i => i.pilar === pilar.nama_pilar);
    let totalPersentase = 0;
    let countIndikatorAdaTarget = 0;

    pilarIndicators.forEach(ind => {
      // Calculate realisasi from capaians for the selected year and up to the selected month
      let totalRealisasi = 0;
      if (ind.capaian_kpi) {
        const filteredCapaians = ind.capaian_kpi.filter((c: any) => c.tahun === tahun && c.bulan <= bulan);
        totalRealisasi = filteredCapaians.reduce((sum: number, c: any) => sum + Number(c.realisasi), 0);
      }

      let pct = 0;
      if (ind.target_tahunan && Number(ind.target_tahunan) > 0) {
        pct = (totalRealisasi / Number(ind.target_tahunan)) * 100;
        if (pct > 100) pct = 100; // Cap at 100% per indicator (optional, but good for average)
        totalPersentase += pct;
        countIndikatorAdaTarget++;
      } else if (ind.target_tahunan === null || Number(ind.target_tahunan) === 0) {
        // Exclude from average if target is null 
      }
    });

    let finalProgress = 0;
    if (countIndikatorAdaTarget > 0) {
      finalProgress = Number((totalPersentase / countIndikatorAdaTarget).toFixed(1));
    } else {
      finalProgress = 0;
    }

    let status = "Belum tercapai";
    if (finalProgress >= 100) status = "Tercapai";
    else if (finalProgress >= 80) status = "Perlu perhatian";

    return {
      ...pilar,
      count: pilarIndicators.length,
      progress: finalProgress,
      status: status,
      trend: finalProgress >= 80 ? 'up' : 'down',
      color: pilar.id % 2 === 0 ? 'from-primary-purple to-primary-pink' : 'from-primary-cyan to-blue-500'
    };
  });

  return result;
}

export async function getCapaianSummary() {
  if (!isSupabaseConfigured()) {
    return [];
  }
  // This gets achievements joined with indicator to aggregate later or directly
  const { data, error } = await supabase!.from('capaian_kpi').select('*, indikator_kpi(pilar_id, target_tahunan)');
  if (error) throw error;
  return data;
}

export async function getIndicatorsWithCapaianByYear(tahun: number) {
  if (!isSupabaseConfigured()) {
    throw new Error("PGRST205"); // Simulate DB error to fallback
  }

  const { data: indicators, error: errInd } = await supabase!
    .from('indikator_kpi')
    .select('*, pilar_kpi(nama_pilar)')
    .order('id', { ascending: true });
  
  if (errInd || !indicators || indicators.length === 0) {
     return []; // Return empty so the frontend can fallback to mock data
  }

  const { data: capaians, error: errCap } = await supabase!.from('capaian_kpi').select('*').eq('tahun', tahun);
  
  const capData = capaians || [];

  return indicators.map(ind => {
    const indCapaians = capData.filter(c => c.indikator_id === ind.id);
    const pilarObj = ind.pilar_kpi as any;
    const pilarName = pilarObj?.nama_pilar || ind.pilar || '';

    return {
      ...ind,
      nama_pilar: pilarName,
      nama_indikator: ind.nama_indikator || ind.uraian_kpi || ind.name,
      target_tahunan: ind.target_tahunan !== undefined && ind.target_tahunan !== null ? ind.target_tahunan : (ind.target || 0),
      capaians: indCapaians
    };
  });
}

export async function saveCapaianMultiple(dataArray: Partial<CapaianKPI>[]) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const { data: result, error } = await supabase!.from('capaian_kpi').upsert(
    dataArray.map(d => ({
      ...d,
      updated_at: new Date().toISOString()
    })), 
    { onConflict: 'indikator_id,bulan,tahun' }
  ).select();

  if (error) throw error;
  return result;
}

export async function uploadDokumenRealisasi(file: File): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase!.storage
    .from('dokumen_realisasi_kpi')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase!.storage
    .from('dokumen_realisasi_kpi')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function saveCapaian(data: Partial<CapaianKPI>) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to .env');
  }

  const { data: result, error } = await supabase!.from('capaian_kpi').upsert({
    ...data,
    created_at: new Date().toISOString()
  }, { onConflict: 'indikator_id,bulan,tahun' }).select();

  if (error) throw error;
  return result;
}
