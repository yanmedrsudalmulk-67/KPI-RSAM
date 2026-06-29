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

  return (data || []).map(ind => {
    let nama_indikator = ind.uraian_kpi || ind.nama_indikator || ind.name;
    return {
      ...ind,
      nama_indikator,
    };
  }) as IndikatorKPI[];
}

export async function getPilarDetail(pilarId: number, tahun?: number, bulan?: number) {
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
  const targetBulan = bulan === undefined ? new Date().getMonth() + 1 : bulan;

  // Process indicators to extract latest capaian for the target year
  const processed = (indicators || []).map(ind => {
    let latestCapaian = null;
    let totalRealisasi = 0;
    let totalTarget = 0;
    
    const isLhpBpk = ind.nama_indikator?.includes("LHP BPK") || ind.name?.includes("LHP BPK") || ind.uraian_kpi?.includes("LHP BPK");

    if (targetBulan === 0) {
      // Mode Tahunan
      const filteredCapaianKpi = (ind.capaian_kpi || []).filter((c: any) => c.tahun === targetYear);
      totalRealisasi = filteredCapaianKpi.reduce((sum: number, c: any) => sum + Number(c.realisasi || 0), 0);
      totalTarget = Number(ind.target_tahunan || 0);

      if (filteredCapaianKpi.length > 0) {
        const sorted = [...filteredCapaianKpi].sort((a: any, b: any) => b.bulan - a.bulan);
        latestCapaian = sorted[0];
      }
    } else {
      // Mode Bulanan
      const capaian = (ind.capaian_kpi || []).find((c: any) => c.tahun === targetYear && c.bulan === targetBulan);
      latestCapaian = capaian || null;
      totalRealisasi = capaian ? Number(capaian.realisasi || 0) : 0;
      
      if (capaian && capaian.target_bulanan !== undefined && capaian.target_bulanan !== null) {
        totalTarget = Number(capaian.target_bulanan);
      } else {
        totalTarget = isLhpBpk ? 0 : (Number(ind.target_tahunan || 0) / 12);
      }
    }

    let progress = 0;
    let status = "Belum tercapai";

    if (isLhpBpk) {
      if (totalTarget === 0 && totalRealisasi === 0) {
        progress = 100;
      } else if (totalTarget === 0 && totalRealisasi > 0) {
        progress = 100;
      } else if (totalTarget > 0) {
        progress = (totalRealisasi / totalTarget) * 100;
      } else {
        progress = 100;
      }
      if (progress > 100) progress = 100;
      if (progress >= 100) status = "Tercapai";
      else if (progress >= 80) status = "Perlu perhatian";
    } else {
      if (totalTarget > 0) {
         progress = (totalRealisasi / totalTarget) * 100;
         if (progress > 100) progress = 100; // Cap at 100% per indicator
         if (progress >= 100) status = "Tercapai";
         else if (progress >= 80) status = "Perlu perhatian";
      } else {
         const targetTahunan = Number(ind.target_tahunan || 0);
         if (targetTahunan > 0) {
           progress = 0;
           status = "Belum tercapai";
         }
      }
    }

    let nama_indikator = ind.uraian_kpi || ind.nama_indikator || ind.name;

    return {
      ...ind,
      nama_indikator,
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
  
  return (data || []).map(ind => {
    let nama_indikator = ind.uraian_kpi || ind.nama_indikator || ind.name;
    return {
      ...ind,
      nama_indikator
    };
  });
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
    let sumProgress = 0;

    pilarIndicators.forEach(ind => {
      let totalTarget = 0;
      let totalRealisasi = 0;
      
      const isLhpBpk = ind.nama_indikator?.includes("LHP BPK") || ind.name?.includes("LHP BPK") || ind.uraian_kpi?.includes("LHP BPK");

      if (bulan === 0) {
        // Mode Tahunan
        const filteredCapaianKpi = (ind.capaian_kpi || []).filter((c: any) => c.tahun === tahun);
        totalRealisasi = filteredCapaianKpi.reduce((sum: number, c: any) => sum + Number(c.realisasi || 0), 0);
        totalTarget = Number(ind.target_tahunan || 0);
      } else {
        // Mode Bulanan
        const capaian = ind.capaian_kpi?.find((c: any) => c.tahun === tahun && c.bulan === bulan);
        totalRealisasi = capaian ? Number(capaian.realisasi || 0) : 0;
        
        if (capaian && capaian.target_bulanan !== undefined && capaian.target_bulanan !== null) {
          totalTarget = Number(capaian.target_bulanan);
        } else {
          totalTarget = isLhpBpk ? 0 : (Number(ind.target_tahunan || 0) / 12);
        }
      }

      let progress = 0;

      if (isLhpBpk) {
        if (totalTarget === 0 && totalRealisasi === 0) {
          progress = 100;
        } else if (totalTarget === 0 && totalRealisasi > 0) {
          progress = 100;
        } else if (totalTarget > 0) {
          progress = (totalRealisasi / totalTarget) * 100;
        } else {
          progress = 100;
        }
        if (progress > 100) progress = 100;
      } else {
        if (totalTarget > 0) {
           progress = (totalRealisasi / totalTarget) * 100;
           if (progress > 100) progress = 100;
        } else {
           const targetTahunan = Number(ind.target_tahunan || 0);
           if (targetTahunan > 0) {
             progress = 0;
           } else {
             progress = 100; // default to 100 if no target exists
           }
        }
      }

      sumProgress += progress;
    });

    const finalProgress = pilarIndicators.length > 0 ? (sumProgress / pilarIndicators.length) : 0;

    let status = "Belum tercapai";
    if (finalProgress >= 100) status = "Tercapai";
    else if (finalProgress >= 80) status = "Perlu perhatian";

    return {
      ...pilar,
      count: pilarIndicators.length,
      progress: Number(finalProgress.toFixed(1)),
      status: status,
      trend: finalProgress >= 80 ? 'up' : 'down'
    };
  });

  return result;
}

export async function getAllDataForAnalytics() {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const { data, error } = await supabase!
    .from('indikator_kpi')
    .select('*, capaian_kpi(*)')
    .order('id', { ascending: true });
  if (error) throw error;
  
  return (data || []).map(ind => {
    let nama_indikator = ind.uraian_kpi || ind.nama_indikator || ind.name;
    return {
      ...ind,
      nama_indikator
    };
  });
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

  const { data: capaians, error } = await supabase!
    .from('capaian_kpi')
    .select('*')
    .eq('tahun', tahun);
  
  const capData = capaians || [];
  if (error) {
     console.error("Error fetching capaians", error);
  }

  return finalIndicators.map(ind => {
    const indCapaians = capData.filter(c => c.indikator_id === ind.id);
    const pilarName = ind.pilar || '';

    let nama_indikator = ind.uraian_kpi || ind.nama_indikator || ind.name;

    return {
      ...ind,
      nama_pilar: pilarName,
      nama_indikator,
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

export async function getDashboardSummaryText(tahun: number, periode: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase!
      .from('dashboard_summary')
      .select('summary_text')
      .eq('tahun', tahun)
      .eq('periode', periode)
      .single();

    if (error) {
      console.warn("Could not fetch summary text (table might not exist yet):", error);
      return null;
    }
    return data?.summary_text || null;
  } catch (err) {
    return null;
  }
}

export async function saveDashboardSummaryText(tahun: number, periode: string, text: string) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  try {
    const { data: existing, error: fetchErr } = await supabase!
      .from('dashboard_summary')
      .select('id')
      .eq('tahun', tahun)
      .eq('periode', periode)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error("Error checking existing summary:", fetchErr);
    }

    if (existing) {
      const { error: updateErr } = await supabase!
        .from('dashboard_summary')
        .update({ summary_text: text, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabase!
        .from('dashboard_summary')
        .insert([{ tahun, periode, summary_text: text, updated_at: new Date().toISOString() }]);
      if (insertErr) throw insertErr;
    }
  } catch (err) {
    console.error("Failed to save dashboard summary to Supabase:", err);
    throw err;
  }
}

