"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Tv,
  Sparkles,
  Link as LinkIcon,
  Video as VideoIcon,
  RefreshCw,
  Eye,
  Wallpaper,
  Settings as SettingsIcon
} from "lucide-react";
import Image from "next/image";

export default function PengaturanPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Background Settings State
  const [welcomeBgType, setWelcomeBgType] = useState<"default" | "image" | "video">("default");
  const [welcomeBgVal, setWelcomeBgVal] = useState<string>("");
  const [menuBgType, setMenuBgType] = useState<"default" | "image" | "video">("default");
  const [menuBgVal, setMenuBgVal] = useState<string>("");

  const [welcomeFile, setWelcomeFile] = useState<File | null>(null);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  
  const [welcomeVideoInput, setWelcomeVideoInput] = useState<string>("");
  const [menuVideoInput, setMenuVideoInput] = useState<string>("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    
    // First, try loading background specs from localStorage for immediate responsiveness
    if (typeof window !== "undefined") {
      const localWType = localStorage.getItem("welcome_bg_type");
      const localWVal = localStorage.getItem("welcome_bg_val");
      const localMType = localStorage.getItem("menu_bg_type");
      const localMVal = localStorage.getItem("menu_bg_val");
      
      if (localWType) setWelcomeBgType(localWType as any);
      if (localWVal) {
        setWelcomeBgVal(localWVal);
        if (localWType === "video") setWelcomeVideoInput(localWVal);
      }
      if (localMType) setMenuBgType(localMType as any);
      if (localMVal) {
        setMenuBgVal(localMVal);
        if (localMType === "video") setMenuVideoInput(localMVal);
      }
    }

    if (!supabase) {
      console.warn("Supabase configuration missing.");
      setIsLoading(false);
      return;
    }

    try {
      // Fetch settings with fallback protection
      const { data, error } = await supabase
        .from("settings")
        .select("logo_url, welcome_bg_type, welcome_bg_val, menu_bg_type, menu_bg_val")
        .eq("id", 1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn("Attempting logo-only fallback fetching due to possible schema differential:", error);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("settings")
          .select("logo_url")
          .eq("id", 1)
          .maybeSingle();

        if (fallbackData && fallbackData.logo_url) {
          const rawUrl = fallbackData.logo_url;
          if (rawUrl.startsWith('{')) {
            try {
              const parsed = JSON.parse(rawUrl);
              if (parsed.logo_url) setLogoUrl(parsed.logo_url);
              
              if (parsed.welcome_bg_type) {
                setWelcomeBgType(parsed.welcome_bg_type as any);
                localStorage.setItem("welcome_bg_type", parsed.welcome_bg_type);
              }
              if (parsed.welcome_bg_val !== undefined && parsed.welcome_bg_val !== null) {
                setWelcomeBgVal(parsed.welcome_bg_val);
                localStorage.setItem("welcome_bg_val", parsed.welcome_bg_val);
                if (parsed.welcome_bg_type === "video") setWelcomeVideoInput(parsed.welcome_bg_val);
              }
              if (parsed.menu_bg_type) {
                setMenuBgType(parsed.menu_bg_type as any);
                localStorage.setItem("menu_bg_type", parsed.menu_bg_type);
              }
              if (parsed.menu_bg_val !== undefined && parsed.menu_bg_val !== null) {
                setMenuBgVal(parsed.menu_bg_val);
                localStorage.setItem("menu_bg_val", parsed.menu_bg_val);
                if (parsed.menu_bg_type === "video") setMenuVideoInput(parsed.menu_bg_val);
              }
            } catch (jsonErr) {
              setLogoUrl(rawUrl);
            }
          } else {
            setLogoUrl(rawUrl);
          }
        }
      } else if (data) {
        let actualLogo = data.logo_url;
        
        // Check if logo_url is actually a JSON string
        if (actualLogo && actualLogo.startsWith('{')) {
          try {
            const parsed = JSON.parse(actualLogo);
            actualLogo = parsed.logo_url || "";
            if (parsed.welcome_bg_type) {
              setWelcomeBgType(parsed.welcome_bg_type as any);
              localStorage.setItem("welcome_bg_type", parsed.welcome_bg_type);
            }
            if (parsed.welcome_bg_val !== undefined && parsed.welcome_bg_val !== null) {
              setWelcomeBgVal(parsed.welcome_bg_val);
              localStorage.setItem("welcome_bg_val", parsed.welcome_bg_val);
              if (parsed.welcome_bg_type === "video") setWelcomeVideoInput(parsed.welcome_bg_val);
            }
            if (parsed.menu_bg_type) {
              setMenuBgType(parsed.menu_bg_type as any);
              localStorage.setItem("menu_bg_type", parsed.menu_bg_type);
            }
            if (parsed.menu_bg_val !== undefined && parsed.menu_bg_val !== null) {
              setMenuBgVal(parsed.menu_bg_val);
              localStorage.setItem("menu_bg_val", parsed.menu_bg_val);
              if (parsed.menu_bg_type === "video") setMenuVideoInput(parsed.menu_bg_val);
            }
          } catch (jsonErr) {
            // ignore, treated as normal URL
          }
        }
        
        setLogoUrl(actualLogo || null);

        // Also fallback to direct columns if they existed and aren't overriden by JSON
        if (data.welcome_bg_type) {
          setWelcomeBgType(data.welcome_bg_type as any);
          localStorage.setItem("welcome_bg_type", data.welcome_bg_type);
        }
        if (data.welcome_bg_val !== undefined && data.welcome_bg_val !== null) {
          setWelcomeBgVal(data.welcome_bg_val);
          localStorage.setItem("welcome_bg_val", data.welcome_bg_val);
          if (data.welcome_bg_type === "video") setWelcomeVideoInput(data.welcome_bg_val);
        }
        if (data.menu_bg_type) {
          setMenuBgType(data.menu_bg_type as any);
          localStorage.setItem("menu_bg_type", data.menu_bg_type);
        }
        if (data.menu_bg_val !== undefined && data.menu_bg_val !== null) {
          setMenuBgVal(data.menu_bg_val);
          localStorage.setItem("menu_bg_val", data.menu_bg_val);
          if (data.menu_bg_type === "video") setMenuVideoInput(data.menu_bg_val);
        }
      }
    } catch (err) {
      console.error("Unexpected error in fetchSettings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  const handleWelcomeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setWelcomeFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  const handleMenuFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMenuFile(e.target.files[0]);
      setStatusMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!supabase) {
      setStatusMessage({
        type: "error",
        text: "Supabase client belum diinisialisasi.",
      });
      return;
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(
          `Upload gagal: ${uploadError.message}. Pastikan bucket 'assets' ada dan public di Supabase.`,
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("assets").getPublicUrl(filePath);

      // Merge current background configurations with the new logo
      let nextLogoValue: string = publicUrl;
      try {
        const { data: currentSettings } = await supabase
          .from("settings")
          .select("logo_url, welcome_bg_type, welcome_bg_val, menu_bg_type, menu_bg_val")
          .eq("id", 1)
          .maybeSingle();
        
        let jsonPayload: any = {};
        if (currentSettings) {
          if (currentSettings.logo_url && currentSettings.logo_url.startsWith('{')) {
            try {
              jsonPayload = JSON.parse(currentSettings.logo_url);
            } catch (e) {}
          } else {
            jsonPayload = {
              welcome_bg_type: currentSettings.welcome_bg_type || localStorage.getItem("welcome_bg_type") || "default",
              welcome_bg_val: currentSettings.welcome_bg_val || localStorage.getItem("welcome_bg_val") || "",
              menu_bg_type: currentSettings.menu_bg_type || localStorage.getItem("menu_bg_type") || "default",
              menu_bg_val: currentSettings.menu_bg_val || localStorage.getItem("menu_bg_val") || ""
            };
          }
        }
        jsonPayload.logo_url = publicUrl;
        nextLogoValue = JSON.stringify(jsonPayload);
      } catch (mergeErr) {
        console.warn("Could not merge existing settings, using primitive:", mergeErr);
      }

      // Try updating standard columns, with a fallback to serialized JSON string inside logo_url
      let saveError: any = null;
      try {
        const { error: dbError } = await supabase
          .from("settings")
          .upsert({
            id: 1,
            logo_url: nextLogoValue,
            welcome_bg_type: localStorage.getItem("welcome_bg_type") || "default",
            welcome_bg_val: localStorage.getItem("welcome_bg_val") || "",
            menu_bg_type: localStorage.getItem("menu_bg_type") || "default",
            menu_bg_val: localStorage.getItem("menu_bg_val") || ""
          }, { onConflict: "id" });

        if (dbError) {
          // Fallback to updating only logo_url
          const { error: fallbackDbError } = await supabase
            .from("settings")
            .upsert({ id: 1, logo_url: nextLogoValue }, { onConflict: "id" });
          if (fallbackDbError) saveError = fallbackDbError;
        }
      } catch (upsertErr: any) {
        saveError = upsertErr;
      }

      if (saveError) {
        throw new Error(
          `Gagal menyimpan data ke tabel settings: ${saveError.message}. Pastikan tabel 'settings' dengan kolom 'id' dan 'logo_url' sudah dibuat.`
        );
      }

      setLogoUrl(publicUrl);
      setStatusMessage({ type: "success", text: "Logo berhasil diperbarui!" });
      setFile(null);
    } catch (error: any) {
      setStatusMessage({
        type: "error",
        text: error.message || "Terjadi kesalahan saat upload.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Safe background saver
  const handleSaveBackground = async (
    target: "welcome" | "menu",
    type: "default" | "image" | "video"
  ) => {
    setIsUploading(true);
    setStatusMessage(null);

    try {
      let finalVal = target === "welcome" ? welcomeBgVal : menuBgVal;
      const targetFile = target === "welcome" ? welcomeFile : menuFile;
      const targetVideoInput = target === "welcome" ? welcomeVideoInput : menuVideoInput;

      if (type === "default") {
        finalVal = "";
      } else if (type === "video") {
        const urlToUse = targetVideoInput.trim();
        if (!urlToUse) {
          throw new Error("Silakan masukkan tautan video yang benar (contoh: https://domain.com/background.mp4)!");
        }
        finalVal = urlToUse;
      } else if (type === "image") {
        if (targetFile) {
          if (!supabase) {
            // Local base64 mode
            finalVal = await convertToBase64(targetFile);
          } else {
            // Server upload mode
            const fileExt = targetFile.name.split(".").pop();
            const fileName = `bg-${target}-${Date.now()}.${fileExt}`;
            const filePath = `backgrounds/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("assets")
              .upload(filePath, targetFile, { upsert: true });

            if (uploadError) {
              throw new Error(`Upload gambar latar belakang gagal: ${uploadError.message}`);
            }

            const {
              data: { publicUrl },
            } = supabase.storage.from("assets").getPublicUrl(filePath);
            finalVal = publicUrl;
          }
        } else {
          if (!finalVal) {
            throw new Error("Silakan pilih file gambar untuk diunggah terlebih dahulu!");
          }
        }
      }

      // Live state assignment
      if (target === "welcome") {
        setWelcomeBgType(type);
        setWelcomeBgVal(finalVal);
        localStorage.setItem("welcome_bg_type", type);
        localStorage.setItem("welcome_bg_val", finalVal);
      } else {
        setMenuBgType(type);
        setMenuBgVal(finalVal);
        localStorage.setItem("menu_bg_type", type);
        localStorage.setItem("menu_bg_val", finalVal);
      }

      // Sync with Supabase (using progressive resilience and JSON serialization fallback)
      if (supabase) {
        // Fetch current settings so we can merge safely
        let existingLogo = "";
        let finalWType = target === "welcome" ? type : welcomeBgType;
        let finalWVal = target === "welcome" ? finalVal : welcomeBgVal;
        let finalMType = target === "menu" ? type : menuBgType;
        let finalMVal = target === "menu" ? finalVal : menuBgVal;

        try {
          const { data: current } = await supabase
            .from("settings")
            .select("logo_url, welcome_bg_type, welcome_bg_val, menu_bg_type, menu_bg_val")
            .eq("id", 1)
            .maybeSingle();

          if (current) {
            existingLogo = current.logo_url || "";
            // If it's a JSON string, parse the inner logo_url
            if (existingLogo.startsWith('{')) {
              try {
                const parsed = JSON.parse(existingLogo);
                existingLogo = parsed.logo_url || "";
                if (target !== "welcome") {
                  finalWType = parsed.welcome_bg_type || finalWType;
                  finalWVal = parsed.welcome_bg_val || finalWVal;
                }
                if (target !== "menu") {
                  finalMType = parsed.menu_bg_type || finalMType;
                  finalMVal = parsed.menu_bg_val || finalMVal;
                }
              } catch (e) {}
            }
          }
        } catch (fetchErr) {
          console.warn("Could not fetch current settings for merge:", fetchErr);
        }

        // Create the combined JSON serialized structure
        const serializedPayload = JSON.stringify({
          logo_url: existingLogo,
          welcome_bg_type: finalWType,
          welcome_bg_val: finalWVal,
          menu_bg_type: finalMType,
          menu_bg_val: finalMVal
        });

        const payload: any = { 
          id: 1, 
          logo_url: serializedPayload,
          welcome_bg_type: finalWType,
          welcome_bg_val: finalWVal,
          menu_bg_type: finalMType,
          menu_bg_val: finalMVal
        };

        // Try standard upsert utilizing all columns first
        const { error: dbError } = await supabase
          .from("settings")
          .upsert(payload, { onConflict: "id" });

        if (dbError) {
          console.warn("Direct columns failed. Falling back to serialized JSON structure inside logo_url:", dbError);
          // Fallback to updating ONLY logo_url with the serialized JSON string structure
          const { error: fallbackError } = await supabase
            .from("settings")
            .upsert({ id: 1, logo_url: serializedPayload }, { onConflict: "id" });

          if (fallbackError) {
            throw new Error(`Gagal menyelaraskan pengaturan ke database Supabase: ${fallbackError.message}`);
          }
        }

        setStatusMessage({
          type: "success",
          text: `Pengaturan Latar Belakang ${target === "welcome" ? "Welcome Page" : "Halaman Menu"} berhasil disimpan dan terintegrasi penuh dengan Supabase!`,
        });
      } else {
        setStatusMessage({
          type: "success",
          text: `Pengaturan Latar Belakang ${target === "welcome" ? "Welcome Page" : "Halaman Menu"} berhasil disimpan secara lokal karena konfigurasi Supabase tidak ditemukan!`,
        });
      }

      // Trigger instant cross-component reload
      window.dispatchEvent(new Event("bg-settings-updated"));
      if (target === "welcome") setWelcomeFile(null);
      else setMenuFile(null);

    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Terjadi kesalahan saat menerapkan pengaturan.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-poppins text-white tracking-tight drop-shadow-md">
          PENGATURAN
        </h1>
        <p className="text-gray-400 mt-1">
          Konfigurasi sistem, logo, serta visual latar belakang premium
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand: Logo setting (1/3 width on wide screens) */}
        <div className="lg:col-span-4 glassmorphism p-6 rounded-2xl border border-white/5 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-4">
            <ImageIcon className="w-5 h-5 text-primary-purple" />
            Logo Rumah Sakit
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-purple animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <span className="text-sm font-medium text-gray-400">
                  Logo Saat Ini:
                </span>
                <div className="w-full h-32 rounded-xl bg-dark-navy/50 border border-white/10 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo RS"
                      className="max-w-full max-h-full object-contain p-2"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-600" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-400 block">
                  Pilih Gambar Baru
                </label>
                <label className="border-2 border-dashed border-white/10 hover:border-primary-purple/50 transition-colors bg-dark-navy/30 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer min-h-[100px]">
                  <Upload className="w-5 h-5 text-gray-500 mb-1" />
                  <span className="text-xs text-gray-400 text-center max-w-[80%] truncate">
                    {file ? file.name : "Klik atau pilih file"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-purple to-primary-pink text-white rounded-xl text-sm font-medium transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? "Menyimpan..." : "Simpan Logo"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Hand: Deep luxury background customizer (2/3 width) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Welcome Background Panel */}
          <div className="glassmorphism p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Wallpaper className="w-5 h-5 text-primary-purple" />
                Latar Belakang: Welcome Page
              </h2>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                <button 
                  onClick={() => setWelcomeBgType("default")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${welcomeBgType === "default" ? "bg-primary-purple text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                >
                  ✨ Default
                </button>
                <button 
                  onClick={() => setWelcomeBgType("image")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${welcomeBgType === "image" ? "bg-primary-purple text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                >
                  🖼️ Gambar
                </button>
                <button 
                  onClick={() => setWelcomeBgType("video")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${welcomeBgType === "video" ? "bg-primary-purple text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                >
                  🎥 Video Link
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form Controls */}
              <div className="md:col-span-7 space-y-4">
                {welcomeBgType === "default" && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs text-gray-300">
                    <p className="font-semibold text-white flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Tema Modern Abstract Luxury</p>
                    <p>Menggunakan mesh gradasi gelap violet super-luminal, lapisan sferis 3D bernuansa premium, lengkap dengan pantulan kaca estetis yang didesain presisi untuk mempertahankan kontras konten.</p>
                  </div>
                )}

                {welcomeBgType === "image" && (
                  <div className="space-y-3">
                    <label className="border-2 border-dashed border-white/10 hover:border-blue-400/50 transition-colors bg-dark-navy/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer min-h-[120px]">
                      <Upload className="w-6 h-6 text-gray-500 mb-2" />
                      <span className="text-xs text-gray-400 text-center">
                        {welcomeFile ? welcomeFile.name : "Pilih gambar latar JPG/PNG baru"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleWelcomeFileChange}
                      />
                    </label>
                    {welcomeBgVal && !welcomeFile && (
                      <p className="text-[10px] text-gray-500 break-all truncate">URL Aktif: {welcomeBgVal}</p>
                    )}
                  </div>
                )}

                {welcomeBgType === "video" && (
                  <div className="space-y-3">
                    <span className="text-xs font-medium text-gray-400">Tautan Link Video MP4 / WebM:</span>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="https://example.com/movie.mp4"
                          value={welcomeVideoInput}
                          onChange={(e) => setWelcomeVideoInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-dark-navy/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary-purple transition-all placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500">Video akan berputar otomatis (autoplay) secara senyap (muted) & berulang (looping) untuk menjamin estetika tanpa mengganggu pengguna.</p>
                  </div>
                )}

                <button
                  onClick={() => handleSaveBackground("welcome", welcomeBgType)}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-purple to-indigo-600 hover:from-primary-purple hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Terapkan Latar Depan
                </button>
              </div>

              {/* Live Preview (Simulated Phone/Desktop Frame) */}
              <div className="md:col-span-5 flex flex-col justify-center">
                <span className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary-purple" /> Simulasi Tampilan Depan
                </span>
                <div className="relative aspect-[16/10] bg-black rounded-lg border border-white/10 overflow-hidden shadow-2xl flex flex-col justify-between p-3">
                  {/* Miniature Background */}
                  <div className="absolute inset-0 z-0">
                    {welcomeBgType === "default" && (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-[#030114] to-black" />
                    )}
                    {welcomeBgType === "image" && (welcomeFile || welcomeBgVal) && (
                      <img 
                        src={welcomeFile ? URL.createObjectURL(welcomeFile) : welcomeBgVal} 
                        className="w-full h-full object-cover" 
                        alt="Preview" 
                      />
                    )}
                    {welcomeBgType === "video" && welcomeVideoInput && (
                      <video 
                        src={welcomeVideoInput} 
                        autoPlay 
                        loop 
                        muted 
                        className="w-full h-full object-cover" 
                      />
                    )}
                    {/* Glass dark cover */}
                    <div className="absolute inset-0 bg-[#030114]/75 backdrop-blur-[0.5px]" />
                  </div>

                  {/* Header mini layout */}
                  <div className="relative z-10 flex justify-between items-center bg-white/5 px-2 py-1 rounded border border-white/10">
                    <span className="text-[6px] font-bold tracking-wider text-blue-100">UOBK AL-MULK</span>
                    <span className="text-[5px] text-gray-500">v1.2.0</span>
                  </div>

                  {/* Form center simulation */}
                  <div className="relative z-10 w-[70%] mx-auto bg-white/5 backdrop-blur-md rounded border border-white/15 p-2 space-y-1.5 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-white/10" />
                    <div className="w-full h-1.5 bg-white/10 rounded-sm" />
                    <div className="w-[80%] h-1.5 bg-white/10 rounded-sm" />
                    <div className="w-full h-2.5 bg-indigo-600 rounded" />
                  </div>

                  {/* footer simulation */}
                  <div className="relative z-10 text-center text-[4px] text-gray-500">
                    Kementerian Kesehatan RI © 2026
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu / Dashboard Background Panel */}
          <div className="glassmorphism p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-indigo-400" />
                Latar Belakang: Halaman Menu / Dashboard
              </h2>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                <button 
                  onClick={() => setMenuBgType("default")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${menuBgType === "default" ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                >
                  ✨ Default
                </button>
                <button 
                  onClick={() => setMenuBgType("image")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${menuBgType === "image" ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                >
                  🖼️ Gambar
                </button>
                <button 
                  onClick={() => setMenuBgType("video")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${menuBgType === "video" ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-white"}`}
                >
                  🎥 Video Link
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form Controls */}
              <div className="md:col-span-7 space-y-4">
                {menuBgType === "default" && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs text-gray-300">
                    <p className="font-semibold text-white flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-400" /> Desain UI Luxury Digital</p>
                    <p>Konsep modern siber dengan lekuk gradasi bergelombang yang dinamis. Dilengkapi bayangan 3D berestetika premium untuk mengoptimalkan visualisasi bagan, grafik KPI, serta tabel data secara profesional.</p>
                  </div>
                )}

                {menuBgType === "image" && (
                  <div className="space-y-3">
                    <label className="border-2 border-dashed border-white/10 hover:border-blue-400/50 transition-colors bg-dark-navy/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer min-h-[120px]">
                      <Upload className="w-6 h-6 text-gray-500 mb-2" />
                      <span className="text-xs text-gray-400 text-center">
                        {menuFile ? menuFile.name : "Pilih gambar latar JPG/PNG baru"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMenuFileChange}
                      />
                    </label>
                    {menuBgVal && !menuFile && (
                      <p className="text-[10px] text-gray-500 break-all truncate">URL Aktif: {menuBgVal}</p>
                    )}
                  </div>
                )}

                {menuBgType === "video" && (
                  <div className="space-y-3">
                    <span className="text-xs font-medium text-gray-400">Tautan Link Video MP4 / WebM:</span>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="https://example.com/particles.mp4"
                          value={menuVideoInput}
                          onChange={(e) => setMenuVideoInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-dark-navy/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-primary-purple transition-all placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500">Video loop modern akan berjalan di belakang dashboard sebagai panel interaktif.</p>
                  </div>
                )}

                <button
                  onClick={() => handleSaveBackground("menu", menuBgType)}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-sm font-medium transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Terapkan Latar Menu
                </button>
              </div>

              {/* Live Preview (Simulated Menu/Dashboard Layout Frame) */}
              <div className="md:col-span-5 flex flex-col justify-center">
                <span className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> Simulasi Halaman Dashboard
                </span>
                <div className="relative aspect-[16/10] bg-black rounded-lg border border-white/10 overflow-hidden shadow-2xl flex p-1.5 gap-1.5">
                  {/* Miniature Background */}
                  <div className="absolute inset-0 z-0">
                    {menuBgType === "default" && (
                      <div className="w-full h-full bg-gradient-to-tr from-black via-[#030114] to-indigo-[950]" />
                    )}
                    {menuBgType === "image" && (menuFile || menuBgVal) && (
                      <img 
                        src={menuFile ? URL.createObjectURL(menuFile) : menuBgVal} 
                        className="w-full h-full object-cover" 
                        alt="Preview" 
                      />
                    )}
                    {menuBgType === "video" && menuVideoInput && (
                      <video 
                        src={menuVideoInput} 
                        autoPlay 
                        loop 
                        muted 
                        className="w-full h-full object-cover" 
                      />
                    )}
                    {/* Glass dark cover */}
                    <div className="absolute inset-0 bg-[#030114]/80 backdrop-blur-[1px]" />
                  </div>

                  {/* Left mini Sidebar */}
                  <div className="relative z-10 w-[25%] bg-white/5 border border-white/10 rounded p-1 flex flex-col gap-1">
                    <div className="w-[80%] h-1.5 bg-white/20 rounded-xs" />
                    <div className="w-full h-1 bg-white/10 rounded-xs" />
                    <div className="w-[90%] h-1 bg-white/10 rounded-xs" />
                    <div className="w-[70%] h-1 bg-white/10 rounded-xs" />
                  </div>

                  {/* Right mini Content */}
                  <div className="relative z-10 flex-1 flex flex-col gap-1.5">
                    <div className="h-2.5 bg-white/5 border border-white/10 rounded flex items-center justify-between px-1">
                      <div className="w-6 h-1 bg-white/20 rounded-xs" />
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-1">
                      <div className="bg-white/5 border border-white/10 rounded p-1 flex flex-col justify-between">
                        <div className="w-4 h-1 bg-white/25 rounded-xs" />
                        <div className="w-2 h-2 rounded-full bg-primary-pink" />
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded p-1 flex flex-col justify-between">
                        <div className="w-4 h-1 bg-white/25 rounded-xs" />
                        <div className="w-3 h-1 bg-white/15 rounded-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Alert Area */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 border ${
                statusMessage.type === "success"
                  ? "bg-primary-green/10 border-primary-green/20 text-emerald-400"
                  : "bg-primary-pink/10 border-primary-pink/20 text-rose-400"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-xs leading-relaxed">{statusMessage.text}</p>
            </div>
          )}

          {/* Tech Spec Helper */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-400" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                Panduan Sinkronisasi Cloud:
              </p>
              <p className="opacity-90">
                Pembaruan latar belakang didukung dengan sinkronisasi instan offline-first. Jika Anda ingin pengaturan tersinkronisasi murni di cloud untuk antar-pengguna, pastikan Anda telah memperbarui tabel <code className="bg-blue-950 px-1 py-0.5 rounded text-white font-mono">settings</code> di Supabase dengan menambahkan kolom-kolom baru:
              </p>
              <pre className="bg-[#030110] border border-white/10 p-2.5 rounded-lg text-[10px] text-indigo-300 font-mono mt-1 overflow-x-auto select-all">
{`ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS welcome_bg_type text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS welcome_bg_val text,
ADD COLUMN IF NOT EXISTS menu_bg_type text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS menu_bg_val text;`}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
