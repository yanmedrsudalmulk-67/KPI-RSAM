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
  Settings as SettingsIcon,
  FileText,
  Trash2
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

  // Dynamic Header State Variables
  const [logoPemkotUrl, setLogoPemkotUrl] = useState<string | null>(null);
  const [logoRsUrl, setLogoRsUrl] = useState<string | null>(null);
  const [headerLine1, setHeaderLine1] = useState<string>("PEMERINTAH KOTA SUKABUMI");
  const [headerLine2, setHeaderLine2] = useState<string>("DINAS KESEHATAN");
  const [headerLine3, setHeaderLine3] = useState<string>("UOBK RSUD AL-MULK KOTA SUKABUMI");
  const [headerLine4, setHeaderLine4] = useState<string>("Jl. Jend. Sudirman No. 123 Kota Sukabumi, Kode Pos 43111, Telp: (0266) 123456, Email: rsudalmulk@sukabumikota.go.id, Website: rsudalmulk.sukabumikota.go.id");
  
  const [filePemkot, setFilePemkot] = useState<File | null>(null);
  const [fileRs, setFileRs] = useState<File | null>(null);
  const [isUploadingPemkot, setIsUploadingPemkot] = useState(false);
  const [isUploadingRs, setIsUploadingRs] = useState(false);
  const [isSavingHeader, setIsSavingHeader] = useState(false);

  // Background Settings State
  const [welcomeBgType, setWelcomeBgType] = useState<"default" | "image" | "video">("default");
  const [welcomeBgVal, setWelcomeBgVal] = useState<string>("");
  const [welcomeVideoInfo, setWelcomeVideoInfo] = useState<{
    name: string;
    size: number;
    uploadDate: string;
    active: boolean;
  } | null>(null);
  const [menuBgType, setMenuBgType] = useState<"default" | "image" | "video">("default");
  const [menuBgVal, setMenuBgVal] = useState<string>("");

  // Social Media State
  const [socialFacebook, setSocialFacebook] = useState<string>("");
  const [socialInstagram, setSocialInstagram] = useState<string>("");
  const [socialTiktok, setSocialTiktok] = useState<string>("");
  const [socialWebsite, setSocialWebsite] = useState<string>("");
  const [isSavingSocial, setIsSavingSocial] = useState(false);

  const [welcomeFile, setWelcomeFile] = useState<File | null>(null);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  
  const [welcomeVideoInput, setWelcomeVideoInput] = useState<string>("");
  const [menuVideoInput, setMenuVideoInput] = useState<string>("");

  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [sliderFiles, setSliderFiles] = useState<File[]>([]);
  const [isUploadingSlider, setIsUploadingSlider] = useState(false);

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
              if (parsed.slider_images && Array.isArray(parsed.slider_images)) setSliderImages(parsed.slider_images);
              
              if (parsed.welcome_bg_type) {
                setWelcomeBgType(parsed.welcome_bg_type as any);
              }
              if (parsed.welcome_bg_val !== undefined && parsed.welcome_bg_val !== null) {
                setWelcomeBgVal(parsed.welcome_bg_val);
                if (parsed.welcome_bg_type === "video") setWelcomeVideoInput(parsed.welcome_bg_val);
              }
              if (parsed.welcome_video_info) {
                setWelcomeVideoInfo(parsed.welcome_video_info);
              }
              if (parsed.menu_bg_type) {
                setMenuBgType(parsed.menu_bg_type as any);
              }
              if (parsed.menu_bg_val !== undefined && parsed.menu_bg_val !== null) {
                setMenuBgVal(parsed.menu_bg_val);
                if (parsed.menu_bg_type === "video") setMenuVideoInput(parsed.menu_bg_val);
              }
              if (parsed.social_media) {
                setSocialFacebook(parsed.social_media.facebook || "");
                setSocialInstagram(parsed.social_media.instagram || "");
                setSocialTiktok(parsed.social_media.tiktok || "");
                setSocialWebsite(parsed.social_media.website || "");
              }

              // Dynamic header
              if (parsed.logo_pemkot_url) setLogoPemkotUrl(parsed.logo_pemkot_url);
              if (parsed.logo_rs_url) setLogoRsUrl(parsed.logo_rs_url);
              if (parsed.header_line_1) setHeaderLine1(parsed.header_line_1);
              if (parsed.header_line_2) setHeaderLine2(parsed.header_line_2);
              if (parsed.header_line_3) setHeaderLine3(parsed.header_line_3);
              if (parsed.header_line_4) setHeaderLine4(parsed.header_line_4);
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
            if (parsed.slider_images && Array.isArray(parsed.slider_images)) setSliderImages(parsed.slider_images);
            if (parsed.welcome_bg_type) {
              setWelcomeBgType(parsed.welcome_bg_type as any);
            }
            if (parsed.welcome_bg_val !== undefined && parsed.welcome_bg_val !== null) {
              setWelcomeBgVal(parsed.welcome_bg_val);
              if (parsed.welcome_bg_type === "video") setWelcomeVideoInput(parsed.welcome_bg_val);
            }
            if (parsed.welcome_video_info) {
              setWelcomeVideoInfo(parsed.welcome_video_info);
            }
            if (parsed.menu_bg_type) {
              setMenuBgType(parsed.menu_bg_type as any);
            }
            if (parsed.menu_bg_val !== undefined && parsed.menu_bg_val !== null) {
              setMenuBgVal(parsed.menu_bg_val);
              if (parsed.menu_bg_type === "video") setMenuVideoInput(parsed.menu_bg_val);
            }
            if (parsed.social_media) {
              setSocialFacebook(parsed.social_media.facebook || "");
              setSocialInstagram(parsed.social_media.instagram || "");
              setSocialTiktok(parsed.social_media.tiktok || "");
              setSocialWebsite(parsed.social_media.website || "");
            }

            // Dynamic header
            if (parsed.logo_pemkot_url) setLogoPemkotUrl(parsed.logo_pemkot_url);
            if (parsed.logo_rs_url) setLogoRsUrl(parsed.logo_rs_url);
            if (parsed.header_line_1) setHeaderLine1(parsed.header_line_1);
            if (parsed.header_line_2) setHeaderLine2(parsed.header_line_2);
            if (parsed.header_line_3) setHeaderLine3(parsed.header_line_3);
            if (parsed.header_line_4) setHeaderLine4(parsed.header_line_4);
          } catch (jsonErr) {
            // ignore, treated as normal URL
          }
        }
        
        setLogoUrl(actualLogo || null);

        // Also fallback to direct columns if they existed and aren't overriden by JSON
        if (data.welcome_bg_type) {
          setWelcomeBgType(data.welcome_bg_type as any);
        }
        if (data.welcome_bg_val !== undefined && data.welcome_bg_val !== null) {
          setWelcomeBgVal(data.welcome_bg_val);
          if (data.welcome_bg_type === "video") setWelcomeVideoInput(data.welcome_bg_val);
        }
        if (data.menu_bg_type) {
          setMenuBgType(data.menu_bg_type as any);
        }
        if (data.menu_bg_val !== undefined && data.menu_bg_val !== null) {
          setMenuBgVal(data.menu_bg_val);
          if (data.menu_bg_type === "video") setMenuVideoInput(data.menu_bg_val);
        }
      }
    } catch (err) {
      console.error("Unexpected error in fetchSettings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveHeaderSettings = async (overrideParams?: any) => {
    if (!supabase) return;
    setIsSavingHeader(true);
    setStatusMessage(null);
    try {
      // 1. Check if we have un-uploaded files and upload them first!
      let finalLogoPemkotUrl = overrideParams?.logo_pemkot_url !== undefined ? overrideParams.logo_pemkot_url : logoPemkotUrl;
      let finalLogoRsUrl = overrideParams?.logo_rs_url !== undefined ? overrideParams.logo_rs_url : logoRsUrl;

      if (filePemkot) {
        try {
          const fileExt = filePemkot.name.split(".").pop();
          const fileName = `logo-pemkot-${Date.now()}.${fileExt}`;
          const filePath = `logos/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("assets")
            .upload(filePath, filePemkot, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(filePath);
          finalLogoPemkotUrl = publicUrl;
          setLogoPemkotUrl(publicUrl);
          setFilePemkot(null);
        } catch (uploadErr: any) {
          throw new Error(`Gagal mengunggah Logo Pemkot: ${uploadErr.message}`);
        }
      }

      if (fileRs) {
        try {
          const fileExt = fileRs.name.split(".").pop();
          const fileName = `logo-rs-${Date.now()}.${fileExt}`;
          const filePath = `logos/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("assets")
            .upload(filePath, fileRs, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(filePath);
          finalLogoRsUrl = publicUrl;
          setLogoRsUrl(publicUrl);
          setFileRs(null);
        } catch (uploadErr: any) {
          throw new Error(`Gagal mengunggah Logo RS: ${uploadErr.message}`);
        }
      }

      // 2. Fetch current settings (selecting only logo_url to avoid schema problems)
      const { data: current } = await supabase
        .from("settings")
        .select("logo_url")
        .eq("id", 1)
        .maybeSingle();

      let jsonPayload: any = {};
      if (current && current.logo_url && current.logo_url.startsWith('{')) {
        try {
          jsonPayload = JSON.parse(current.logo_url);
        } catch (e) {}
      } else if (current) {
        jsonPayload.logo_url = current.logo_url || "";
      }

      // Merge current and new values
      jsonPayload.logo_pemkot_url = finalLogoPemkotUrl;
      jsonPayload.logo_rs_url = finalLogoRsUrl;
      jsonPayload.header_line_1 = overrideParams?.header_line_1 !== undefined ? overrideParams.header_line_1 : headerLine1;
      jsonPayload.header_line_2 = overrideParams?.header_line_2 !== undefined ? overrideParams.header_line_2 : headerLine2;
      jsonPayload.header_line_3 = overrideParams?.header_line_3 !== undefined ? overrideParams.header_line_3 : headerLine3;
      jsonPayload.header_line_4 = overrideParams?.header_line_4 !== undefined ? overrideParams.header_line_4 : headerLine4;

      const nextLogoValue = JSON.stringify(jsonPayload);

      // 3. Upsert into database (only using id and logo_url to ensure it never fails due to missing column schemas)
      const { error: dbError } = await supabase
        .from("settings")
        .upsert({ id: 1, logo_url: nextLogoValue }, { onConflict: "id" });

      if (dbError) throw dbError;

      setStatusMessage({ type: "success", text: "Pengaturan Header Laporan berhasil disimpan!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: `Gagal menyimpan header: ${err.message}` });
    } finally {
      setIsSavingHeader(false);
    }
  };

  const handleUploadPemkot = async () => {
    if (!filePemkot || !supabase) return;
    setIsUploadingPemkot(true);
    setStatusMessage(null);
    try {
      const fileExt = filePemkot.name.split(".").pop();
      const fileName = `logo-pemkot-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(filePath, filePemkot, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(filePath);
      
      setLogoPemkotUrl(publicUrl);
      setFilePemkot(null);
      
      // Save instantly
      await handleSaveHeaderSettings({ logo_pemkot_url: publicUrl });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: `Gagal upload Logo Pemkot: ${err.message}` });
    } finally {
      setIsUploadingPemkot(false);
    }
  };

  const handleUploadRs = async () => {
    if (!fileRs || !supabase) return;
    setIsUploadingRs(true);
    setStatusMessage(null);
    try {
      const fileExt = fileRs.name.split(".").pop();
      const fileName = `logo-rs-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("assets")
        .upload(filePath, fileRs, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(filePath);
      
      setLogoRsUrl(publicUrl);
      setFileRs(null);
      
      // Save instantly
      await handleSaveHeaderSettings({ logo_rs_url: publicUrl });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: `Gagal upload Logo RS: ${err.message}` });
    } finally {
      setIsUploadingRs(false);
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
      const file = e.target.files[0];
      
      if (welcomeBgType === "video") {
        if (file.type !== "video/mp4" && !file.name.endsWith(".mp4")) {
          setStatusMessage({
            type: "error",
            text: "Format file harus MP4!",
          });
          return;
        }
        if (file.size > 200 * 1024 * 1024) {
          setStatusMessage({
            type: "error",
            text: "Ukuran video maksimal 200 MB",
          });
          return;
        }
      } else if (welcomeBgType === "image") {
        if (!file.type.startsWith("image/")) {
          setStatusMessage({
            type: "error",
            text: "Format file harus gambar (JPG/PNG)!",
          });
          return;
        }
      }
      
      setWelcomeFile(file);
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
              welcome_bg_type: currentSettings.welcome_bg_type || "default",
              welcome_bg_val: currentSettings.welcome_bg_val || "",
              menu_bg_type: currentSettings.menu_bg_type || "default",
              menu_bg_val: currentSettings.menu_bg_val || ""
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
            welcome_bg_type: "default",
            welcome_bg_val: "",
            menu_bg_type: "default",
            menu_bg_val: ""
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

  const handleSaveSliderImages = async (urlsToSave: string[]) => {
    if (!supabase) return;
    setIsUploadingSlider(true);
    setStatusMessage(null);

    try {
      let nextLogoValue: string = "";
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
            logo_url: currentSettings.logo_url || "",
            welcome_bg_type: currentSettings.welcome_bg_type || "default",
            welcome_bg_val: currentSettings.welcome_bg_val || "",
            menu_bg_type: currentSettings.menu_bg_type || "default",
            menu_bg_val: currentSettings.menu_bg_val || ""
          };
        }
      }
      
      jsonPayload.slider_images = urlsToSave;
      nextLogoValue = JSON.stringify(jsonPayload);

      let saveError: any = null;
      try {
        const { error: dbError } = await supabase
          .from("settings")
          .upsert({
            id: 1,
            logo_url: nextLogoValue,
            welcome_bg_type: jsonPayload.welcome_bg_type || "default",
            welcome_bg_val: jsonPayload.welcome_bg_val || "",
            menu_bg_type: jsonPayload.menu_bg_type || "default",
            menu_bg_val: jsonPayload.menu_bg_val || ""
          }, { onConflict: "id" });

        if (dbError) {
          const { error: fallbackDbError } = await supabase
            .from("settings")
            .upsert({ id: 1, logo_url: nextLogoValue }, { onConflict: "id" });
          if (fallbackDbError) saveError = fallbackDbError;
        }
      } catch (upsertErr: any) {
        saveError = upsertErr;
      }

      if (saveError) {
        throw new Error(`Gagal menyimpan data slider: ${saveError.message}`);
      }

      setSliderImages(urlsToSave);
      setStatusMessage({ type: "success", text: "Slider berhasil diperbarui!" });
    } catch (error: any) {
      setStatusMessage({
        type: "error",
        text: error.message || "Terjadi kesalahan saat menyimpan slider.",
      });
    } finally {
      setIsUploadingSlider(false);
    }
  };

  const handleUploadNewSliderImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !supabase) return;

    if (sliderImages.length + fileList.length > 10) {
      setStatusMessage({
        type: "error",
        text: "Maksimal 10 gambar slider yang diperbolehkan."
      });
      e.target.value = '';
      return;
    }
    
    setIsUploadingSlider(true);
    setStatusMessage(null);
    
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const fileExt = f.name.split(".").pop();
        const fileName = `slider-${Date.now()}-${i}.${fileExt}`;
        const filePath = `sliders/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("assets")
          .upload(filePath, f, { upsert: true });

        if (uploadError) throw new Error(uploadError.message);

        const { data: { publicUrl } } = supabase.storage.from("assets").getPublicUrl(filePath);
        newUrls.push(publicUrl);
      }
      
      const updatedImages = [...sliderImages, ...newUrls];
      await handleSaveSliderImages(updatedImages);
      // reset input
      e.target.value = '';
    } catch (error: any) {
      setStatusMessage({
        type: "error",
        text: `Gagal upload slider: ${error.message}`
      });
      setIsUploadingSlider(false);
    }
  };

  const handleRemoveSliderImage = async (indexToRemove: number) => {
    const updatedImages = sliderImages.filter((_, idx) => idx !== indexToRemove);
    await handleSaveSliderImages(updatedImages);
  };

  const handleSaveSocialMedia = async () => {
    if (!supabase) return;
    setIsSavingSocial(true);
    setStatusMessage(null);

    try {
      let nextLogoValue: string = "";
      const { data: currentSettings } = await supabase
        .from("settings")
        .select("logo_url")
        .eq("id", 1)
        .maybeSingle();

      let jsonPayload: any = {};
      if (currentSettings && currentSettings.logo_url && currentSettings.logo_url.startsWith('{')) {
        try {
          jsonPayload = JSON.parse(currentSettings.logo_url);
        } catch (e) {}
      } else if (currentSettings) {
        jsonPayload.logo_url = currentSettings.logo_url;
      }

      jsonPayload.social_media = {
        facebook: socialFacebook,
        instagram: socialInstagram,
        tiktok: socialTiktok,
        website: socialWebsite
      };

      nextLogoValue = JSON.stringify(jsonPayload);

      const { error: dbError } = await supabase
        .from("settings")
        .upsert({ id: 1, logo_url: nextLogoValue }, { onConflict: "id" });

      if (dbError) throw new Error(dbError.message);

      setStatusMessage({ type: "success", text: "Pengaturan Media Sosial berhasil disimpan!" });
    } catch (error: any) {
      setStatusMessage({
        type: "error",
        text: `Gagal menyimpan media sosial: ${error.message}`
      });
    } finally {
      setIsSavingSocial(false);
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
      let nextVideoInfo = welcomeVideoInfo;

      if (type === "default") {
        finalVal = "";
        if (target === "welcome") {
          nextVideoInfo = null;
        }
      } else if (type === "video") {
        if (target === "welcome") {
          if (targetFile) {
            if (targetFile.type !== "video/mp4" && !targetFile.name.endsWith(".mp4")) {
              throw new Error("Format file harus MP4!");
            }
            if (targetFile.size > 200 * 1024 * 1024) {
              throw new Error("Ukuran video maksimal 200 MB");
            }

            if (!supabase) {
              finalVal = await convertToBase64(targetFile);
              nextVideoInfo = {
                name: targetFile.name,
                size: targetFile.size,
                uploadDate: new Date().toISOString(),
                active: true
              };
            } else {
              const fileExt = "mp4";
              const fileName = `welcome-video-${Date.now()}.${fileExt}`;
              const filePath = `backgrounds/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from("assets")
                .upload(filePath, targetFile, { upsert: true });

              if (uploadError) {
                throw new Error(`Upload video gagal: ${uploadError.message}`);
              }

              const {
                data: { publicUrl },
              } = supabase.storage.from("assets").getPublicUrl(filePath);
              finalVal = publicUrl;

              nextVideoInfo = {
                name: targetFile.name,
                size: targetFile.size,
                uploadDate: new Date().toISOString(),
                active: true
              };
            }
          } else {
            if (!finalVal) {
              throw new Error("Silakan pilih file video untuk diunggah terlebih dahulu!");
            }
            if (nextVideoInfo) {
              nextVideoInfo.active = true;
            }
          }
        } else {
          const urlToUse = targetVideoInput.trim();
          if (!urlToUse) {
            throw new Error("Silakan masukkan tautan video yang benar (contoh: https://domain.com/background.mp4)!");
          }
          finalVal = urlToUse;
        }
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
        setWelcomeVideoInfo(nextVideoInfo);
      } else {
        setMenuBgType(type);
        setMenuBgVal(finalVal);
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

        // Adjust video info active status
        if (nextVideoInfo) {
          nextVideoInfo.active = (finalWType === "video");
        }

        // Create the combined JSON serialized structure
        const serializedPayload = JSON.stringify({
          logo_url: existingLogo,
          welcome_bg_type: finalWType,
          welcome_bg_val: finalWVal,
          menu_bg_type: finalMType,
          menu_bg_val: finalMVal,
          welcome_video_info: nextVideoInfo
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
          type: "error",
          text: `Gagal menyimpan pengaturan: Konfigurasi Supabase tidak ditemukan! Pastikan Anda telah mengatur NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY pada Vercel.`,
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

          {/* A. Pengaturan Kop Surat / Header Laporan */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Pengaturan Kop Surat / Header Laporan</h2>
                <p className="text-sm text-gray-400">
                  Ubah logo resmi pemerintah kota, logo rumah sakit, serta identitas instansi yang akan dicetak di header PDF KPI.
                </p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              
              {/* Dua Logo Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/10">
                
                {/* Logo Pemkot Sukabumi */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Logo 1: Pemerintah Kota Sukabumi</span>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-dark-navy/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {logoPemkotUrl ? (
                        <img src={logoPemkotUrl} alt="Logo Pemkot" className="max-w-full max-h-full object-contain p-1" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 transition-colors bg-dark-navy/30 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer min-h-[50px]">
                        <Upload className="w-4 h-4 text-gray-500 mb-1" />
                        <span className="text-[11px] text-gray-400 text-center truncate max-w-full">
                          {filePemkot ? filePemkot.name : "Pilih Logo Pemkot"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFilePemkot(e.target.files[0]);
                              setStatusMessage(null);
                            }
                          }}
                        />
                      </label>
                      {filePemkot && (
                        <button
                          onClick={handleUploadPemkot}
                          disabled={isUploadingPemkot}
                          className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium transition-all active:scale-95"
                        >
                          {isUploadingPemkot ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          Unggah Logo Pemkot
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logo RSUD Al-Mulk */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Logo 2: RSUD Al-Mulk Sukabumi</span>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-dark-navy/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {logoRsUrl ? (
                        <img src={logoRsUrl} alt="Logo RSUD Al-Mulk" className="max-w-full max-h-full object-contain p-1" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 transition-colors bg-dark-navy/30 rounded-xl p-2.5 flex flex-col items-center justify-center cursor-pointer min-h-[50px]">
                        <Upload className="w-4 h-4 text-gray-500 mb-1" />
                        <span className="text-[11px] text-gray-400 text-center truncate max-w-full">
                          {fileRs ? fileRs.name : "Pilih Logo RS"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setFileRs(e.target.files[0]);
                              setStatusMessage(null);
                            }
                          }}
                        />
                      </label>
                      {fileRs && (
                        <button
                          onClick={handleUploadRs}
                          disabled={isUploadingRs}
                          className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium transition-all active:scale-95"
                        >
                          {isUploadingRs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          Unggah Logo RS
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Teks Identitas KOP Surat */}
              <div className="space-y-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Identitas Kop Surat (Teks Tengah)</span>
                
                <div>
                  <label className="text-xs text-gray-300 block mb-1">Baris 1 - Pemerintah (Teks Bold)</label>
                  <input
                    type="text"
                    value={headerLine1}
                    onChange={(e) => setHeaderLine1(e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-navy/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-600"
                    placeholder="PEMERINTAH KOTA SUKABUMI"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Baris 2 - Dinas Kesehatan (Teks Regular)</label>
                  <input
                    type="text"
                    value={headerLine2}
                    onChange={(e) => setHeaderLine2(e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-navy/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-600"
                    placeholder="DINAS KESEHATAN"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Baris 3 - Nama Unit / Rumah Sakit (Teks Bold)</label>
                  <input
                    type="text"
                    value={headerLine3}
                    onChange={(e) => setHeaderLine3(e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-navy/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-600"
                    placeholder="UOBK RSUD AL-MULK KOTA SUKABUMI"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-300 block mb-1">Baris 4 - Alamat & Kontak Lengkap (Teks Regular)</label>
                  <textarea
                    rows={3}
                    value={headerLine4}
                    onChange={(e) => setHeaderLine4(e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-navy/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-600 resize-none"
                    placeholder="Jl. Jend. Sudirman No. 123 Kota Sukabumi..."
                  />
                </div>

                <button
                  onClick={() => handleSaveHeaderSettings()}
                  disabled={isSavingHeader}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition-transform active:scale-[0.98] disabled:opacity-50 mt-4"
                >
                  {isSavingHeader ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Simpan Identitas Kop Surat
                </button>

              </div>

            </div>
          </div>

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
                  <div className="space-y-4">
                    {/* Active Video Info Card */}
                    {welcomeBgVal ? (
                      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white flex items-center gap-1.5 text-xs">
                            <VideoIcon className="w-4 h-4 text-primary-purple" /> Video Latar Belakang Aktif
                          </p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${welcomeVideoInfo?.active ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border border-amber-500/30"}`}>
                            {welcomeVideoInfo?.active ? "● Aktif" : "○ Nonaktif"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 border-t border-white/5 pt-2">
                          <div>
                            <span className="block text-[9px] text-gray-500 font-mono">NAMA FILE</span>
                            <span className="font-medium text-gray-300 break-all">{welcomeVideoInfo?.name || "welcome-video.mp4"}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-gray-500 font-mono">UKURAN FILE</span>
                            <span className="font-medium text-gray-300">
                              {welcomeVideoInfo?.size ? `${(welcomeVideoInfo.size / (1024 * 1024)).toFixed(2)} MB` : "Terdokumentasi"}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="block text-[9px] text-gray-500 font-mono">TANGGAL UPLOAD</span>
                            <span className="font-medium text-gray-300">
                              {welcomeVideoInfo?.uploadDate ? new Date(welcomeVideoInfo.uploadDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Baru-baru ini"}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="block text-[9px] text-gray-500 font-mono">SUMBER</span>
                            <span className="font-medium text-gray-300 truncate block">Supabase Storage</span>
                          </div>
                        </div>

                        {/* Interactive Preview of the current active video */}
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-black/40">
                          <video 
                            src={welcomeBgVal} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            preload="metadata"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-white">
                            Live Preview
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setWelcomeFile(null);
                              const inputEl = document.getElementById("welcome-video-upload-input");
                              if (inputEl) inputEl.click();
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-all cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-primary-purple" /> Ganti Video
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm("Apakah Anda yakin ingin menghapus video latar belakang welcome page ini?")) {
                                setWelcomeBgVal("");
                                setWelcomeVideoInfo(null);
                                setWelcomeFile(null);
                                await handleSaveBackground("welcome", "default");
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all border border-red-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus Video
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="border-2 border-dashed border-white/10 hover:border-primary-purple/50 hover:bg-white/[0.02] transition-all bg-dark-navy/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer min-h-[140px] group relative">
                          <VideoIcon className="w-8 h-8 text-gray-500 group-hover:text-primary-purple transition-colors mb-2" />
                          <span className="text-xs font-semibold text-white">Upload Video MP4</span>
                          <span className="text-[10px] text-gray-400 text-center mt-1">
                            {welcomeFile ? welcomeFile.name : "Seret & letakkan atau klik untuk memilih file video"}
                          </span>
                          <span className="text-[9px] text-gray-500 mt-0.5">Format .MP4 (Maksimal 200MB)</span>
                          <input
                            id="welcome-video-upload-input"
                            type="file"
                            accept="video/mp4"
                            className="hidden"
                            onChange={handleWelcomeFileChange}
                          />
                        </label>
                      </div>
                    )}

                    {welcomeFile && (
                      <div className="p-4 bg-primary-purple/5 border border-primary-purple/20 rounded-xl space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-4 h-4 text-primary-purple" /> Video Terpilih (Belum Disimpan)
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {(welcomeFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-black/40">
                          <video 
                            src={URL.createObjectURL(welcomeFile)} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-amber-500/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-white font-medium">
                            Preview Baru
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setWelcomeFile(null)}
                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-all"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {welcomeBgVal && (
                      <input
                        id="welcome-video-upload-input"
                        type="file"
                        accept="video/mp4"
                        className="hidden"
                        onChange={handleWelcomeFileChange}
                      />
                    )}

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
                    {welcomeBgType === "video" && (welcomeFile || welcomeBgVal) && (
                      <video 
                        src={welcomeFile ? URL.createObjectURL(welcomeFile) : welcomeBgVal} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
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

          {/* Slider Setting Area */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Pengaturan Slider Dashboard</h2>
                <p className="text-sm text-gray-400">
                  Unggah gambar yang akan ditampilkan pada slider coverflow di atas 7 Pilar. Disarankan aspek rasio 16:9.
                </p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              {/* Image Grid */}
              {sliderImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sliderImages.map((url, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group/item">
                      <img src={url} alt={`Slider ${idx}`} className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button
                          onClick={() => handleRemoveSliderImage(idx)}
                          className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full transform scale-90 group-hover/item:scale-100 transition-all"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Input */}
              <div>
                <label className="block w-full cursor-pointer group/upload">
                  <div className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors ${
                    isUploadingSlider ? "border-gray-500 bg-gray-500/5" : "border-indigo-500/50 bg-indigo-500/5 group-hover/upload:bg-indigo-500/10 group-hover/upload:border-indigo-400"
                  }`}>
                    {isUploadingSlider ? (
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-indigo-400 group-hover/upload:scale-110 transition-transform" />
                    )}
                    <span className="text-sm font-medium text-gray-300">
                      {isUploadingSlider ? "Sedang Mengunggah..." : "Pilih Gambar Baru (Bisa Lebih dari Satu)"}
                    </span>
                    <span className="text-xs text-gray-500">Mendukung format PNG, JPG, JPEG</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleUploadNewSliderImage}
                    disabled={isUploadingSlider}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Pengaturan Media Sosial */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Pengaturan Media Sosial</h2>
                <p className="text-sm text-gray-400">
                  Konfigurasi URL untuk publikasi kegiatan dan promosi RS. (Pastikan URL menggunakan https://)
                </p>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1">Facebook URL</label>
                <input
                  type="url"
                  placeholder="https://facebook.com/rsalmulk"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-navy/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1">Instagram URL</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/rsalmulk"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-navy/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1">TikTok URL</label>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@rsalmulk"
                  value={socialTiktok}
                  onChange={(e) => setSocialTiktok(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-navy/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1">Website Resmi URL</label>
                <input
                  type="url"
                  placeholder="https://www.rsalmulk.co.id"
                  value={socialWebsite}
                  onChange={(e) => setSocialWebsite(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-navy/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-gray-600"
                />
              </div>

              <button
                onClick={handleSaveSocialMedia}
                disabled={isSavingSocial}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-sm font-medium transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {isSavingSocial ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Simpan Media Sosial
              </button>
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
                Aplikasi ini sekarang terintegrasi penuh dan murni bergantung pada Supabase untuk menyimpan semua pengaturan dan file yang diunggah. Pastikan variabel lingkungan (Environment Variables) telah diatur di Vercel, dan Anda telah menjalankan query di bawah ini pada Supabase SQL Editor:
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
