'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HeartPulse } from 'lucide-react';

export default function RSLogo({ size = 'large' }: { size?: 'small' | 'large' }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogo() {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from('settings')
          .select('logo_url')
          .eq('id', 1)
          .single();
        if (data && data.logo_url) {
          let url = data.logo_url;
          if (url.startsWith('{')) {
            try {
              const parsed = JSON.parse(url);
              url = parsed.logo_url || '';
            } catch {
              // ignore
            }
          }
          setLogoUrl(url || null);
        }
      } catch {
        // Abaikan error, gunakan logo default
      }
    }
    fetchLogo();
  }, []);

  const logoClasses = "w-[34px] h-[34px] object-contain transition-transform duration-150 ease-out group-hover:scale-105";

  const containerClasses = "w-[42px] h-[43px] group transition-all duration-150 ease-out flex items-center justify-center flex-shrink-0";

  return (
    <div className={containerClasses}>
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt="Logo RS" 
          className={logoClasses} 
          style={{
            filter: "drop-shadow(1px 0px 0px #ffffff) drop-shadow(-1px 0px 0px #ffffff) drop-shadow(0px 1px 0px #ffffff) drop-shadow(0px -1px 0px #ffffff) drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
          }}
        />
      ) : size === 'small' ? (
        <HeartPulse 
          className="w-6 h-6 text-blue-400 group-hover:scale-105 transition-transform" 
          style={{
            filter: "drop-shadow(1px 0px 0px #ffffff) drop-shadow(-1px 0px 0px #ffffff) drop-shadow(0px 1px 0px #ffffff) drop-shadow(0px -1px 0px #ffffff)"
          }}
        />
      ) : (
        <HeartPulse 
          className="w-7 h-7 text-blue-400 group-hover:scale-105 transition-transform" 
          style={{
            filter: "drop-shadow(1px 0px 0px #ffffff) drop-shadow(-1px 0px 0px #ffffff) drop-shadow(0px 1px 0px #ffffff) drop-shadow(0px -1px 0px #ffffff)"
          }}
        />
      )}
    </div>
  );
}
