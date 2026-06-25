import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase!.from('indikator_kpi').select('*, capaian_kpi(*)').limit(3);
  return NextResponse.json({ data, error });
}
