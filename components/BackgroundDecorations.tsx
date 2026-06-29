"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function BackgroundDecorations() {
  const pathname = usePathname();
  const [welcomeBgType, setWelcomeBgType] = useState<string>("default");
  const [welcomeBgVal, setWelcomeBgVal] = useState<string>("");
  const [menuBgType, setMenuBgType] = useState<string>("default");
  const [menuBgVal, setMenuBgVal] = useState<string>("");

  const loadSettings = async () => {
    // 2. Cloud synchronization from Supabase
    if (supabase) {
      try {
        // Try selecting all direct columns first
        const { data, error } = await supabase
          .from("settings")
          .select(
            "welcome_bg_type, welcome_bg_val, menu_bg_type, menu_bg_val, logo_url",
          )
          .eq("id", 1)
          .single();

        if (!error && data) {
          if (data.welcome_bg_type) {
            setWelcomeBgType(data.welcome_bg_type);
          }
          if (
            data.welcome_bg_val !== undefined &&
            data.welcome_bg_val !== null
          ) {
            setWelcomeBgVal(data.welcome_bg_val);
          }
          if (data.menu_bg_type) {
            setMenuBgType(data.menu_bg_type);
          }
          if (data.menu_bg_val !== undefined && data.menu_bg_val !== null) {
            setMenuBgVal(data.menu_bg_val);
          }

          // Check if logo_url itself is a serialized JSON payload
          if (data.logo_url && data.logo_url.startsWith("{")) {
            try {
              const parsed = JSON.parse(data.logo_url);
              if (parsed.welcome_bg_type) {
                setWelcomeBgType(parsed.welcome_bg_type);
              }
              if (
                parsed.welcome_bg_val !== undefined &&
                parsed.welcome_bg_val !== null
              ) {
                setWelcomeBgVal(parsed.welcome_bg_val);
              }
              if (parsed.menu_bg_type) {
                setMenuBgType(parsed.menu_bg_type);
              }
              if (
                parsed.menu_bg_val !== undefined &&
                parsed.menu_bg_val !== null
              ) {
                setMenuBgVal(parsed.menu_bg_val);
              }
            } catch {
              // ignore
            }
          }
        } else {
          // If direct columns failed (possibly missing in schema), fetch only logo_url and inspect JSON payload
          const { data: logoOnlyData, error: logoOnlyError } = await supabase
            .from("settings")
            .select("logo_url")
            .eq("id", 1)
            .single();

          if (
            !logoOnlyError &&
            logoOnlyData &&
            logoOnlyData.logo_url &&
            logoOnlyData.logo_url.startsWith("{")
          ) {
            try {
              const parsed = JSON.parse(logoOnlyData.logo_url);
              if (parsed.welcome_bg_type) {
                setWelcomeBgType(parsed.welcome_bg_type);
              }
              if (
                parsed.welcome_bg_val !== undefined &&
                parsed.welcome_bg_val !== null
              ) {
                setWelcomeBgVal(parsed.welcome_bg_val);
              }
              if (parsed.menu_bg_type) {
                setMenuBgType(parsed.menu_bg_type);
              }
              if (
                parsed.menu_bg_val !== undefined &&
                parsed.menu_bg_val !== null
              ) {
                setMenuBgVal(parsed.menu_bg_val);
              }
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.warn(
          "Could not load backgrounds from cloud settings table:",
          err,
        );
      }
    }
  };

  useEffect(() => {
    loadSettings();

    // Custom reactive event to change backgrounds globally instantly upon hitting Save
    const handleBgSync = () => {
      loadSettings();
    };

    window.addEventListener("bg-settings-updated", handleBgSync);
    return () => {
      window.removeEventListener("bg-settings-updated", handleBgSync);
    };
  }, []);

  // Determine current active section
  const isWelcomePage = pathname === "/" || pathname === "";
  const bgType = isWelcomePage ? welcomeBgType : menuBgType;
  const bgVal = isWelcomePage ? welcomeBgVal : menuBgVal;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#02010c] select-none">
      {/* CASE A: Custom Uploaded Image */}
      {bgType === "image" && bgVal && (
        <div className="absolute inset-0 w-full h-full animate-fade-in duration-700">
          <img
            src={bgVal}
            alt="Latar Belakang Kustom"
            className={`w-full h-full object-cover transition-opacity duration-500 ${isWelcomePage ? "opacity-100" : "opacity-50"}`}
          />
          {/* Elegant Dark Overlay for main pages to ensure contrast */}
          {!isWelcomePage && (
            <>
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02010c] via-transparent to-black/20" />
            </>
          )}
        </div>
      )}

      {/* CASE B: Custom Autoplay Video Link (automatically plays) */}
      {bgType === "video" && bgVal && (
        <div className="absolute inset-0 w-full h-full animate-fade-in duration-700">
          <video
            src={bgVal}
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-500 ${isWelcomePage ? "opacity-100" : "opacity-50"}`}
          />
          {/* Elegant Dark Overlay for main pages to ensure contrast */}
          {!isWelcomePage && (
            <>
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.5px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02010c] via-transparent to-black/30" />
            </>
          )}
        </div>
      )}

      {/* CASE C: Default Modern Abstract Luxury Gradient Theme (The beautiful SVG vectors) */}
      {bgType === "default" && !isWelcomePage && (
        <>
          {/* Ambient Glow Bubbles */}
          <div
            className="absolute top-[-25%] left-[-20%] w-[90vw] h-[90vw] rounded-full opacity-75 mix-blend-screen blur-[140px]"
            style={{
              background:
                "radial-gradient(circle, rgba(124, 58, 237, 0.28) 0%, rgba(99, 102, 241, 0.12) 50%, rgba(3, 1, 20, 0) 80%)",
            }}
          />
          <div
            className="absolute top-[10%] right-[-15%] w-[70vw] h-[70vw] rounded-full opacity-45 mix-blend-screen blur-[130px]"
            style={{
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(30, 27, 75, 0.05) 60%, rgba(3, 1, 20, 0) 90%)",
            }}
          />
          <div
            className="absolute bottom-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full opacity-55 mix-blend-screen blur-[150px]"
            style={{
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.05) 50%, rgba(3, 1, 20, 0) 80%)",
            }}
          />

          {/* Dynamic Responsive SVG Waves with drop-shadow layers */}
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 1440 900"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="crestGlowOpt1"
                x1="0%"
                y1="100%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0" />
                <stop offset="30%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="85%" stopColor="#c084fc" stopOpacity="1" />
                <stop offset="100%" stopColor="#e9d5ff" stopOpacity="0" />
              </linearGradient>

              <linearGradient
                id="crestGlowOpt2"
                x1="0%"
                y1="100%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>

              <linearGradient
                id="deepWaveOpt1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#05031d" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#030214" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#010008" stopOpacity="1" />
              </linearGradient>

              <linearGradient
                id="deepWaveOpt2"
                x1="0%"
                y1="100%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#0f0740" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#070324" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#01000a" stopOpacity="1" />
              </linearGradient>

              <filter
                id="softDepthShadow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="-10"
                  dy="-10"
                  stdDeviation="25"
                  floodColor="#000000"
                  floodOpacity="0.85"
                />
              </filter>

              <filter
                id="neonReflect"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur stdDeviation="15" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Sweep A: Upper Background Layer */}
            <path
              d="M 1440 0 C 1300 250, 1100 450, 850 630 C 650 780, 300 850, 0 900 L 1440 900 Z"
              fill="url(#deepWaveOpt1)"
              filter="url(#softDepthShadow)"
            />

            {/* Radiant Crest line A */}
            <path
              d="M 1440 30 C 1310 270, 1110 460, 860 635 C 660 782, 310 852, 0 900"
              fill="none"
              stroke="url(#crestGlowOpt1)"
              strokeWidth="5"
              filter="url(#neonReflect)"
              className="opacity-75"
            />

            {/* Intermediary blend layer */}
            <path
              d="M 0 900 C 250 820, 500 870, 750 710 C 1000 550, 1250 350, 1440 180 L 1440 900 Z"
              fill="url(#deepWaveOpt2)"
              className="opacity-60"
            />

            {/* Sweep B: Foreground fluid rise */}
            <path
              d="M 0 900 C 200 850, 400 710, 650 730 C 950 755, 1200 840, 1440 720 L 1440 900 L 0 900 Z"
              fill="#01000b"
              filter="url(#softDepthShadow)"
            />

            {/* Radiant Crest line B */}
            <path
              d="M 0 885 C 200 835, 400 695, 650 715 C 950 740, 1200 825, 1440 705"
              fill="none"
              stroke="url(#crestGlowOpt2)"
              strokeWidth="4"
              filter="url(#neonReflect)"
            />

            {/* Reflection filaments */}
            <path
              d="M 100 880 C 250 840, 420 730, 650 740"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="1.5"
              strokeOpacity="0.45"
              filter="url(#neonReflect)"
            />
          </svg>

          {/* Smooth Light leak reflection at header */}
          <div
            className="absolute top-0 left-0 right-0 h-[25vh] opacity-20 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(139, 92, 246, 0.15) 0%, rgba(3, 1, 20, 0) 100%)",
            }}
          />
        </>
      )}
    </div>
  );
}
