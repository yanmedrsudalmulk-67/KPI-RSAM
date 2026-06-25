"use client";

import { ArrowRight, Activity, HeartPulse } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import RSLogo from "@/components/RSLogo";

export default function LandingPage() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen text-white flex flex-col relative font-roboto-condensed overflow-hidden">
      {/* Background Cinematic Overlay for Landing Page */}
      <div className="absolute inset-0 z-[-1] pointer-events-none">
        {/* Subtle, localized vignettes from top-left and bottom-left corners (using radial-gradient for a perfectly soft, borderless blend) */}
        <div 
          className="absolute top-0 left-0 w-[45%] h-[40%]"
          style={{ background: 'radial-gradient(circle at top left, rgba(2, 6, 23, 0.35) 0%, rgba(2, 6, 23, 0.15) 45%, rgba(2, 6, 23, 0) 100%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[45%] h-[40%]"
          style={{ background: 'radial-gradient(circle at bottom left, rgba(2, 6, 23, 0.35) 0%, rgba(2, 6, 23, 0.15) 45%, rgba(2, 6, 23, 0) 100%)' }}
        ></div>

        {/* Mobile / Portrait mode: super smooth eased bottom-up gradient to protect text legibility without visible transition lines */}
        <div 
          className="absolute inset-0 block md:hidden portrait:block landscape:hidden"
          style={{ background: 'linear-gradient(to top, rgba(2, 6, 23, 0.85) 0%, rgba(2, 6, 23, 0.55) 20%, rgba(2, 6, 23, 0.3) 45%, rgba(2, 6, 23, 0.12) 70%, rgba(2, 6, 23, 0.03) 85%, rgba(2, 6, 23, 0) 100%)' }}
        ></div>

        {/* Landscape / Desktop cinematic side gradients (prevented from overlapping/stacking in portrait) */}
        <div className="hidden md:block landscape:block portrait:hidden absolute inset-0">
          <div className="absolute top-0 left-0 bottom-0 w-[60%] bg-gradient-to-r from-[#020617]/70 via-[#020617]/30 to-transparent"></div>
          <div className="absolute top-0 right-0 bottom-0 w-[40%] bg-gradient-to-l from-[#020617]/90 via-[#020617]/40 to-transparent"></div>
        </div>
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-6 md:p-10 w-full animate-in fade-in slide-in-from-top-8 duration-1000 -mt-2 md:-mt-[18px]">
        <div className="flex items-center gap-4">
          <RSLogo size="large" />
          <div className="flex flex-col">
            <span className="font-roboto-condensed font-bold text-lg md:text-xl text-white tracking-wide drop-shadow-md">
              UOBK RSUD AL-MULK
            </span>
            <span className="font-roboto-condensed font-bold text-xs text-[#8aed86] tracking-[0.2em] uppercase">
              Kota Sukabumi
            </span>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end min-w-[120px]">
          {time ? (
            <>
              <span className="font-roboto-condensed font-bold italic text-[11px] text-[#8aed86] mb-1 tracking-[0.2em] uppercase">
                {formatDate(time)}
              </span>
              <span className="font-roboto-condensed text-xl font-bold tracking-[0.1em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {formatTime(time).replace(/\./g, ":")}
              </span>
            </>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <div className="h-3 w-16 animate-pulse bg-white/5 rounded" />
              <div className="h-6 w-24 animate-pulse bg-white/5 rounded" />
            </div>
          )}
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 z-10 flex flex-col md:flex-row w-full relative pt-24 md:pt-0">
        {/* Left Area - Text (Bottom Left Aligned) */}
        <div className="w-full md:w-[60%] flex-1 flex flex-col justify-end p-6 sm:p-10 md:p-12 lg:p-16 pb-12 sm:pb-12 md:pb-16 relative z-10">
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
            <h3 className="font-roboto-condensed font-medium text-blue-400 tracking-[0.2em] uppercase text-[10px] sm:text-xs mb-3 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
              Selamat Datang Di
            </h3>

            <h1 className="text-[50px] font-black font-roboto-condensed mb-3 sm:mb-4 text-white leading-[1.05] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-white">
              KEY PERFORMANCE
              <br />
              <span className="text-white">INDICATOR (KPI)</span>
            </h1>

            <h2 className="text-[19px] font-bold tracking-wide text-[#8aed86] mb-3 sm:mb-4 drop-shadow-md border-l-4 border-blue-500 pl-3">
              UOBK RSUD AL-MULK KOTA SUKABUMI
            </h2>

            <Link
              href="/dashboard"
              className="group relative inline-flex items-center gap-3 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full font-semibold text-white tracking-widest transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:scale-[1.02] overflow-hidden border border-blue-400/30 w-fit"
            >
              <span className="relative z-10 text-[10px] sm:text-xs md:text-sm whitespace-nowrap font-roboto-condensed">
                MASUK KE DASHBOARD
              </span>
              <div className="relative z-10 bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-slide-right" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
