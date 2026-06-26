import { supabase, isSupabaseConfigured } from '../supabase';
import { pilarKpi } from '../data';

export interface PilarKPI {
  id: number;
  nama_pilar: string;
  deskripsi: string;
}

export interface IndikatorKPI {
  id: number;
  pilar_id?: number;
  pilar?: string;
  nama_pilar?: string;
  nama_indikator: string;
  uraian_kpi?: string;
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
  return pilarKpi.map(p => ({
    id: p.id,
    nama_pilar: p.name,
    deskripsi: p.name,
  })) as PilarKPI[];
}

export async function getIndicatorsByPilar(pilarId: number) {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const foundPilar = pilarKpi.find(p => p.id === pilarId);
  if (!foundPilar) return [];

  const { data, error } = await supabase!
    .from('indikator_kpi')
    .select('*')
    .eq('pilar', foundPilar.name)
    .order('id', { ascending: true });
  if (error) throw error;

  return (data || []).map(ind => ({
    ...ind,
    nama_indikator: ind.uraian_kpi || ind.nama_indikator || ind.name,
  })) as IndikatorKPI[];
}

export async function getPilarDetail(pilarId: number, tahun?: number) {
  if (!isSupabaseConfigured()) return { pilar: null, indicators: [] };
  
  const foundPilar = pilarKpi.find((p) => p.id === pilarId);
  if (!foundPilar) return { pilar: null, indicators: [] };
  const pilar = { ...foundPilar, nama_pilar: foundPilar.name };

  const { data: indicators, error: err2 } = await supabase!
    .from('indikator_kpi')
    .select('*, capaian_kpi(*)')
    .eq('pilar', pilar.nama_pilar)
    .order('id', { ascending: true });
  if (err2) throw err2;

  const targetYear = tahun || new Date().getFullYear();

  // Process indicators to extract latest capaian for the target year
  const processed = (indicators || []).map(ind => {
    let latestCapaian = null;
    let totalRealisasi = 0;
    
    // Filter capaian_kpi by targetYear
    const filteredCapaianKpi = (ind.capaian_kpi || []).filter((c: any) => c.tahun === targetYear);

    if (filteredCapaianKpi.length > 0) {
      // Sort by bulan desc
      const sorted = [...filteredCapaianKpi].sort((a: any, b: any) => b.bulan - a.bulan);
      latestCapaian = sorted[0];
      totalRealisasi = filteredCapaianKpi.reduce((sum: number, c: any) => sum + Number(c.realisasi), 0);
    }

    let progress = 0;
    let status = "Belum tercapai";
    if (ind.target_tahunan > 0) {
       progress = (totalRealisasi / ind.target_tahunan) * 100;
       if (progress > 100) progress = 100; // Cap at 100% per indicator
       if (progress >= 100) status = "Tercapai";
       else if (progress >= 80) status = "Perlu perhatian";
    }

    return {
      ...ind,
      nama_indikator: ind.uraian_kpi || ind.nama_indikator || ind.name,
      capaian_kpi: ind.capaian_kpi, // Keep all-years list for table reference
      latestCapaian,
      totalRealisasi,
      progress: Number(progress.toFixed(1)),
      status
    };
  });

  return { pilar, indicators: processed };
}

export async function getIndicators() {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const { data, error } = await supabase!
    .from('indikator_kpi')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  
  return (data || []).map(ind => ({
    ...ind,
    nama_indikator: ind.uraian_kpi || ind.nama_indikator || ind.name,
  }));
}

export async function getDashboardSummary(tahun: number, bulan: number) {
  if (!isSupabaseConfigured()) {
    throw new Error("PGRST205"); // Simulate DB error to fallback
  }

  // Fetch all indicators with their capaians
  const { data: indicators, error: errInd } = await supabase!
    .from('indikator_kpi')
    .select('*, capaian_kpi(*)');
  if (errInd) throw errInd;

  // Derive pilars from indicators
  const pilarNames = [...new Set((indicators || []).map(i => i.pilar))].filter(Boolean);
  
  // Sort pilars so PILAR 1 comes before PILAR 2, etc.
  pilarNames.sort((a, b) => {
    const aNum = parseInt(a.match(/PILAR (\d+)/)?.[1] || "999");
    const bNum = parseInt(b.match(/PILAR (\d+)/)?.[1] || "999");
    return aNum - bNum;
  });

  const pilars = pilarNames.map((name, index) => {
    const matchedPilar = pilarKpi.find(p => p.name === name);
    return {
      id: matchedPilar?.id || (index + 1),
      nama_pilar: name,
      color: matchedPilar?.color || 'from-primary-purple to-primary-pink'
    };
  });

  const result = pilars.map((pilar) => {
    const pilarIndicators = (indicators || []).filter(i => i.pilar === pilar.nama_pilar);
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
        if (pct > 100) pct = 100; // Cap at 100% per indicator (optional)
        totalPersentase += pct;
        countIndikatorAdaTarget++;
      }
    });

    let finalProgress = 0;
    if (countIndikatorAdaTarget > 0) {
      finalProgress = Number((totalPersentase / countIndikatorAdaTarget).toFixed(1));
    }

    let status = "Belum tercapai";
    if (finalProgress >= 100) status = "Tercapai";
    else if (finalProgress >= 80) status = "Perlu perhatian";

    return {
      ...pilar,
      count: pilarIndicators.length,
      progress: finalProgress,
      status: status,
      trend: finalProgress >= 80 ? 'up' : 'down'
    };
  });

  return result;
}

export async function getCapaianSummary() {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const { data, error } = await supabase!
    .from('capaian_kpi')
    .select('*, indikator_kpi(pilar, target_tahunan)');
  if (error) throw error;
  return data;
}

export async function getIndicatorsWithCapaianByYear(tahun: number) {
  if (!isSupabaseConfigured()) {
    throw new Error("PGRST205"); // Simulate DB error to fallback
  }

  const { data: indicators, error: errInd } = await supabase!
    .from('indikator_kpi')
    .select('*')
    .order('id', { ascending: true });
  
  if (errInd) {
    return []; // Return empty so the frontend can fallback to mock data
  }

  let finalIndicators = indicators || [];

  // Seed data if empty
  if (finalIndicators.length === 0) {
    const seedData = pilarKpi.flatMap(p => 
      (p as any).indicators?.map((ind: any) => ({
        nomor: ind.id,
        pilar: p.name,
        uraian_kpi: ind.name,
        satuan: ind.target > 1000 ? 'Rupiah' : (ind.target === 100 ? 'Persen' : 'Orang'),
        target_tahunan: ind.target,
        keterangan: ''
      })) || []
    );

    // Only if we actually have seed data
    if (seedData.length > 0) {
      const { data: inserted, error: seedErr } = await supabase!
        .from('indikator_kpi')
        .insert(seedData)
        .select();
      
      if (!seedErr && inserted) {
        finalIndicators = inserted;
      }
    }
  }

  if (finalIndicators.length === 0) {
    return [];
  }

  const { data: capaians, error: errCap } = await supabase!
    .from('capaian_kpi')
    .select('*')
    .eq('tahun', tahun);
  
  const capData = capaians || [];

  return finalIndicators.map(ind => {
    const indCapaians = capData.filter(c => c.indikator_id === ind.id);
    const pilarName = ind.pilar || '';

    return {
      ...ind,
      nama_pilar: pilarName,
      nama_indikator: ind.uraian_kpi || ind.nama_indikator || ind.name,
      target_tahunan: ind.target_tahunan !== undefined && ind.target_tahunan !== null ? ind.target_tahunan : (ind.target || 0),
      capaians: indCapaians
    };
  });
}

export async function saveCapaianMultiple(dataArray: Partial<CapaianKPI>[]) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const results = [];
  for (const item of dataArray) {
    const payload = { ...item, updated_at: new Date().toISOString() };
    
    // Attempt to update first using unique constraint (indikator_id, tahun, bulan)
    const { data: updateData, error: updateError } = await supabase!
      .from('capaian_kpi')
      .update(payload)
      .eq('indikator_id', item.indikator_id as number)
      .eq('tahun', item.tahun as number)
      .eq('bulan', item.bulan as number)
      .select();

    if (updateError) {
      console.error("Supabase update error:", updateError);
      throw new Error(`DB Error: ${updateError.message}`);
    }

    // If update affected 0 rows, it means the row doesn't exist, so insert it
    if (!updateData || updateData.length === 0) {
      const { data: insertData, error: insertError } = await supabase!
        .from('capaian_kpi')
        .insert([payload])
        .select();
      
      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(`DB Error: ${insertError.message}`);
      }
      if (insertData) results.push(insertData[0]);
    } else {
      results.push(updateData[0]);
    }
  }

  return results;
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

  const payload = { ...data, updated_at: new Date().toISOString() };
  
  // Attempt update first
  const { data: updateData, error: updateError } = await supabase!
    .from('capaian_kpi')
    .update(payload)
    .eq('indikator_id', data.indikator_id as number)
    .eq('tahun', data.tahun as number)
    .eq('bulan', data.bulan as number)
    .select();

  if (updateError) {
    console.error("Supabase update error:", updateError);
    throw new Error(`DB Error: ${updateError.message}`);
  }

  if (!updateData || updateData.length === 0) {
    const { data: insertData, error: insertError } = await supabase!
      .from('capaian_kpi')
      .insert([payload])
      .select();
    
    if (insertError) {
      console.error("Supabase insert error:", insertError);
      throw new Error(`DB Error: ${insertError.message}`);
    }
    return insertData?.[0];
  }

  return updateData[0];
}
