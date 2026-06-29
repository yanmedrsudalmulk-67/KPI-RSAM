"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import { 
  FileText, Printer, 
  Search, Activity, Target, CheckCircle2, AlertTriangle, XCircle,
  Loader2
} from "lucide-react";
import { getAllDataForAnalytics } from "@/lib/services/api";
import { pilarKpi } from "@/lib/data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { motion, animate, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const JENIS_LAPORAN = ["Bulanan", "Triwulan", "Semester", "Tahunan"];

export default function LaporanPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Header settings state
  const [logoPemkotUrl, setLogoPemkotUrl] = useState<string | null>(null);
  const [logoRsUrl, setLogoRsUrl] = useState<string | null>(null);
  const [headerLine1, setHeaderLine1] = useState<string>("PEMERINTAH KOTA SUKABUMI");
  const [headerLine2, setHeaderLine2] = useState<string>("DINAS KESEHATAN");
  const [headerLine3, setHeaderLine3] = useState<string>("UOBK RSUD AL-MULK KOTA SUKABUMI");
  const [headerLine4, setHeaderLine4] = useState<string>("Jl. Jend. Sudirman No. 123 Kota Sukabumi, Kode Pos 43111, Telp: (0266) 123456, Email: rsudalmulk@sukabumikota.go.id, Website: rsudalmulk.sukabumikota.go.id");

  // Filters
  const [filterJenisLaporan, setFilterJenisLaporan] = useState<string>("Bulanan");
  const [filterTahun, setFilterTahun] = useState<number>(new Date().getFullYear());
  const [filterPeriode, setFilterPeriode] = useState<string>((new Date().getMonth() + 1).toString());
  const [filterPilar, setFilterPilar] = useState<string>("Semua");
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const [searchTerm, setSearchTerm] = useState("");

  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showNoDataDialog, setShowNoDataDialog] = useState(false);

  useEffect(() => {
    if (snackbar) {
      const timer = setTimeout(() => {
        setSnackbar(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [snackbar]);

  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured()) {
        try {
          const res = await getAllDataForAnalytics();
          setData(res);
          
          if (supabase) {
            const { data: settingsData } = await supabase.from("settings").select("logo_url").eq("id", 1).maybeSingle();
            if (settingsData && settingsData.logo_url) {
              if (settingsData.logo_url.startsWith("{")) {
                const parsed = JSON.parse(settingsData.logo_url);
                if (parsed.logo_url) setLogoUrl(parsed.logo_url);
                if (parsed.logo_pemkot_url) setLogoPemkotUrl(parsed.logo_pemkot_url);
                if (parsed.logo_rs_url) setLogoRsUrl(parsed.logo_rs_url);
                if (parsed.header_line_1) setHeaderLine1(parsed.header_line_1);
                if (parsed.header_line_2) setHeaderLine2(parsed.header_line_2);
                if (parsed.header_line_3) setHeaderLine3(parsed.header_line_3);
                if (parsed.header_line_4) setHeaderLine4(parsed.header_line_4);
              } else {
                setLogoUrl(settingsData.logo_url);
                setLogoRsUrl(settingsData.logo_url);
              }
            }
          }
        } catch(e) {
          console.error(e);
        }
      } 
      setLoading(false);
    }
    loadData();
  }, []);

  // Update default periode when jenis laporan changes
  useEffect(() => {
    if (filterJenisLaporan === "Bulanan") setFilterPeriode((new Date().getMonth() + 1).toString());
    else if (filterJenisLaporan === "Triwulan") setFilterPeriode("Q1");
    else if (filterJenisLaporan === "Semester") setFilterPeriode("S1");
    else if (filterJenisLaporan === "Tahunan") setFilterPeriode("Tahunan");
  }, [filterJenisLaporan]);

  const processedData = useMemo(() => {
    let filtered = data;
    
    if (filterPilar !== "Semua") {
      filtered = filtered.filter(d => d.pilar === filterPilar);
    }
    if (searchTerm) {
      filtered = filtered.filter(d => (d.nama_indikator || "").toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return filtered.map(ind => {
      let targetValue = 0;
      let realisasiValue = 0;
      
      const targetTahunan = Number(ind.target_tahunan || 0);
      let capaians = ind.capaian_kpi?.filter((c: any) => c.tahun === filterTahun) || [];

      if (filterJenisLaporan === "Tahunan") {
        targetValue = targetTahunan;
        realisasiValue = capaians.reduce((sum: number, c: any) => sum + Number(c.realisasi || 0), 0);
      } 
      else if (filterJenisLaporan === "Semester") {
        const isS1 = filterPeriode === "S1";
        capaians = capaians.filter((c: any) => isS1 ? c.bulan <= 6 : c.bulan > 6);
        targetValue = targetTahunan / 2;
        realisasiValue = capaians.reduce((sum: number, c: any) => sum + Number(c.realisasi || 0), 0);
      } 
      else if (filterJenisLaporan === "Triwulan") {
        const q = parseInt(filterPeriode.replace("Q", ""));
        capaians = capaians.filter((c: any) => c.bulan > (q-1)*3 && c.bulan <= q*3);
        targetValue = targetTahunan / 4;
        realisasiValue = capaians.reduce((sum: number, c: any) => sum + Number(c.realisasi || 0), 0);
      } 
      else if (filterJenisLaporan === "Bulanan") {
        const b = parseInt(filterPeriode);
        const matched = capaians.find((c: any) => c.bulan === b);
        if (matched && matched.target_bulanan !== null && matched.target_bulanan !== undefined) {
           targetValue = Number(matched.target_bulanan);
        } else {
           targetValue = targetTahunan / 12;
        }
        realisasiValue = matched ? Number(matched.realisasi || 0) : 0;
      }

      let progress = 0;
      let status = "Belum Tercapai";
      const isLhpBpk = ind.nama_indikator?.includes("LHP BPK") || ind.name?.includes("LHP BPK") || ind.uraian_kpi?.includes("LHP BPK");

      if (isLhpBpk) {
        if (targetValue === 0 && realisasiValue === 0) {
          progress = 100;
        } else if (targetValue === 0 && realisasiValue > 0) {
          progress = 100;
        } else if (targetValue > 0) {
          progress = (realisasiValue / targetValue) * 100;
        } else {
          progress = 100;
        }
      } else {
        if (targetValue > 0) {
          progress = (realisasiValue / targetValue) * 100;
        } else if (targetTahunan > 0) {
          progress = 0;
        }
      }

      if (progress >= 100) status = "Tercapai";
      else if (progress >= 80) status = "Hampir Tercapai";
      else status = "Belum Tercapai";

      return {
        ...ind,
        targetValue,
        realisasiValue,
        progress: progress > 100 ? 100 : progress,
        statusStr: status,
      };
    });
  }, [data, filterTahun, filterJenisLaporan, filterPeriode, filterPilar, searchTerm]);

  const finalFilteredData = useMemo(() => {
    let result = processedData;
    if (filterStatus !== "Semua") {
      result = result.filter(d => d.statusStr === filterStatus);
    }
    return result;
  }, [processedData, filterStatus]);

  // Summary calculations
  const tTotal = finalFilteredData.length;
  const tTercapai = finalFilteredData.filter(d => d.statusStr === "Tercapai").length;
  const tBelum = finalFilteredData.filter(d => d.statusStr === "Belum Tercapai" || d.statusStr === "Hampir Tercapai").length;
  const avgKPI = tTotal > 0 ? (finalFilteredData.reduce((s, d) => s + d.progress, 0) / tTotal) : 0;

  const getTargetTitle = () => {
    if (filterJenisLaporan === "Bulanan") return "Target Bulan Ini";
    if (filterJenisLaporan === "Triwulan") return "Target Triwulan";
    if (filterJenisLaporan === "Semester") return "Target Semester";
    return "Target Tahunan";
  };

  const getRealisasiTitle = () => {
    if (filterJenisLaporan === "Bulanan") return "Realisasi Bulan Ini";
    if (filterJenisLaporan === "Triwulan") return "Realisasi Triwulan";
    if (filterJenisLaporan === "Semester") return "Realisasi Semester";
    return "Realisasi Tahunan";
  };

  const getPeriodeString = () => {
    if (filterJenisLaporan === "Tahunan" || filterPeriode === "Semua" || filterPeriode === "Tahunan") {
      return `TAHUN ${filterTahun}`;
    }
    if (filterJenisLaporan === "Bulanan") {
      const monthIndex = parseInt(filterPeriode) - 1;
      const monthName = !isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12 ? MONTHS[monthIndex].toUpperCase() : "";
      return `BULAN ${monthName} TAHUN ${filterTahun}`;
    }
    if (filterJenisLaporan === "Triwulan") {
      const quarter = filterPeriode === "Q1" ? "I" : filterPeriode === "Q2" ? "II" : filterPeriode === "Q3" ? "III" : filterPeriode === "Q4" ? "IV" : filterPeriode;
      return `TRIWULAN ${quarter} TAHUN ${filterTahun}`;
    }
    if (filterJenisLaporan === "Semester") {
      const sem = filterPeriode === "S1" ? "I" : filterPeriode === "S2" ? "II" : filterPeriode;
      return `SEMESTER ${sem} TAHUN ${filterTahun}`;
    }
    return `TAHUN ${filterTahun}`;
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    if (url.startsWith("data:")) {
      return url;
    }

    let fetchUrl = url;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      fetchUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }

    try {
      const res = await fetch(fetchUrl);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Failed to fetch image via URL fetch, trying alternative Image element method", err);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute("src", url);
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
          } else {
            reject(new Error("Could not get canvas context"));
          }
        };
        img.onerror = (e) => reject(e);
      });
    }
  };

  const getPdfTargetTitle = () => {
    if (filterJenisLaporan === "Bulanan") return "Target / \nBulan Ini";
    if (filterJenisLaporan === "Triwulan") return "Target / \nTriwulan";
    if (filterJenisLaporan === "Semester") return "Target / \nSemester";
    return "Target / \nTahun Ini";
  };

  const getPdfTargetTitleUppercase = () => {
    if (filterJenisLaporan === "Bulanan") return "TARGET BULAN INI";
    if (filterJenisLaporan === "Triwulan") return "TARGET TRIWULAN";
    if (filterJenisLaporan === "Semester") return "TARGET SEMESTER";
    return "TARGET TAHUN INI";
  };

  const getPdfRealisasiTitle = () => {
    if (filterJenisLaporan === "Bulanan") return "Realisasi / \nBulan Ini";
    if (filterJenisLaporan === "Triwulan") return "Realisasi / \nTriwulan";
    if (filterJenisLaporan === "Semester") return "Realisasi / \nSemester";
    return "Realisasi / \nTahun Ini";
  };

  const getPdfRealisasiTitleUppercase = () => {
    if (filterJenisLaporan === "Bulanan") return "REALISASI BULAN INI";
    if (filterJenisLaporan === "Triwulan") return "REALISASI TRIWULAN";
    if (filterJenisLaporan === "Semester") return "REALISASI SEMESTER";
    return "REALISASI TAHUN INI";
  };

  const downloadPDF = async () => {
    if (finalFilteredData.length === 0) {
      setShowNoDataDialog(true);
      return;
    }
    setIsDownloadingPdf(true);
    let downloadUrl: string | null = null;
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 1. Fetch logo base64 if available
      let pemkotBase64 = "";
      let rsBase64 = "";
      if (logoPemkotUrl) {
        try {
          pemkotBase64 = await getBase64ImageFromUrl(logoPemkotUrl);
        } catch (e) {
          console.warn("Error getting Pemkot logo base64:", e);
        }
      }
      if (logoRsUrl) {
        try {
          rsBase64 = await getBase64ImageFromUrl(logoRsUrl);
        } catch (e) {
          console.warn("Error getting RSUD logo base64:", e);
        }
      }

      // Helper to get image dimensions
      const getImageDimensions = (base64Str: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({ width: img.width, height: img.height });
          };
          img.onerror = () => {
            resolve({ width: 1, height: 1 });
          };
          img.src = base64Str;
        });
      };

      // Helper function to draw dynamic header on first page
      const drawFirstPageHeader = async () => {
        // Left Logo (Pemkot)
        if (pemkotBase64) {
          const pemkotDimensions = await getImageDimensions(pemkotBase64);
          const pemkotAspect = pemkotDimensions.width / pemkotDimensions.height;
          const logoHeight = 20;
          const pemkotWidth = logoHeight * pemkotAspect;
          doc.addImage(pemkotBase64, "PNG", 25, 18, pemkotWidth, logoHeight);
        }
        // Right Logo (RS)
        if (rsBase64) {
          const rsDimensions = await getImageDimensions(rsBase64);
          const rsAspect = rsDimensions.width / rsDimensions.height;
          const logoHeight = 20;
          const rsWidth = logoHeight * rsAspect;
          doc.addImage(rsBase64, "PNG", 190 - rsWidth, 18, rsWidth, logoHeight);
        }

        // Center Text Block (Header Instansi)
        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(headerLine1.toUpperCase(), 107.5, 23, { align: "center" });

        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.text(headerLine2.toUpperCase(), 107.5, 29, { align: "center" });

        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.text(headerLine3.toUpperCase(), 107.5, 35, { align: "center" });

        // Address wrapping
        doc.setFont("times", "normal");
        doc.setFontSize(9);
        const wrappedAddress = doc.splitTextToSize(headerLine4, 110);
        doc.text(wrappedAddress, 107.5, 40, { align: "center" });

        // Double Horizontal Line (kop surat style)
        doc.setLineWidth(0.8);
        doc.line(25, 48, 190, 48);
        doc.setLineWidth(0.25);
        doc.line(25, 49.5, 190, 49.5);
      };

      // Draw the header on the first page
      await drawFirstPageHeader();

      // 2. Document Title (positioned lower to give elegant spacing from double-line kop)
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.text("LAPORAN KEY PERFORMANCE INDICATOR (KPI)", 107.5, 54.5, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`PERIODE: ${getPeriodeString().toUpperCase()}`, 107.5, 59.0, { align: "center" });

      // 3. Group Pilars into Pages based on height
      const grouped: Record<string, any[]> = {};
      finalFilteredData.forEach(d => {
        if (!grouped[d.pilar]) grouped[d.pilar] = [];
        grouped[d.pilar].push(d);
      });

      const pilarNames = pilarKpi.map(p => p.name);
      const existingPilars = Object.keys(grouped).sort((a, b) => pilarNames.indexOf(a) - pilarNames.indexOf(b));

      interface PageGroup {
        pilars: {
          name: string;
          rows: any[];
          estimatedHeight: number;
        }[];
      }

      const pages: PageGroup[] = [{ pilars: [] }];
      let currentPageIndex = 0;
      let currentPageY = 64.0; // Starting Y on page 1 after kop and title to give perfect spacing (exactly 5mm below title line 2)
      let tempGlobalIndex = 0;

      existingPilars.forEach(pilarName => {
        const rawRows = grouped[pilarName] || [];
        
        // Detect sub-groups to know exact row count
        const subGroupRows: any[] = [];
        let addedOptimalisasiAsetParent = false;
        let addedCrossSellingParent = false;

        rawRows.forEach((d) => {
          const rawName = d.nama_indikator || "";
          if (rawName.startsWith("Jumlah aset yang dimanfaatkan - ")) {
            if (!addedOptimalisasiAsetParent) {
              subGroupRows.push({ isParent: true, isChild: false, name: "Jumlah aset yang dimanfaatkan" });
              addedOptimalisasiAsetParent = true;
            }
            subGroupRows.push({
              isParent: false,
              isChild: true,
              name: rawName.replace("Jumlah aset yang dimanfaatkan - ", ""),
              ...d
            });
          } else if (rawName.startsWith("Cross selling - ")) {
            if (!addedCrossSellingParent) {
              subGroupRows.push({ isParent: true, isChild: false, name: "Cross selling" });
              addedCrossSellingParent = true;
            }
            subGroupRows.push({
              isParent: false,
              isChild: true,
              name: rawName.replace("Cross selling - ", ""),
              ...d
            });
          } else {
            subGroupRows.push({
              isParent: false,
              isChild: false,
              name: rawName,
              ...d
            });
          }
        });

        // Construct rows for this Pilar
        const pilarRows: any[] = [];
        // 1. Add Pilar Header Row
        pilarRows.push([
          {
            content: pilarName.toUpperCase(),
            colSpan: 6,
            styles: {
              fillColor: [240, 240, 240],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'left',
              cellPadding: 1.0,
            }
          }
        ]);

        // 2. Add Indicator Rows
        subGroupRows.forEach((row) => {
          let displayNo = "";
          if (row.isParent) {
            tempGlobalIndex++;
            displayNo = tempGlobalIndex.toString();
          } else if (!row.isChild) {
            tempGlobalIndex++;
            displayNo = tempGlobalIndex.toString();
          }

          if (row.isParent) {
            pilarRows.push([
              displayNo,
              row.name,
              "",
              "",
              "",
              ""
            ]);
          } else {
            const displayName = row.isChild ? `      ${row.name}` : row.name;
            pilarRows.push([
              displayNo,
              displayName,
              row.targetValue !== undefined ? row.targetValue.toLocaleString("id-ID", { maximumFractionDigits: 0 }) : "0",
              row.realisasiValue !== undefined ? row.realisasiValue.toLocaleString("id-ID", { maximumFractionDigits: 0 }) : "0",
              row.progress !== undefined ? `${Math.round(row.progress)}%` : "0%",
              row.statusStr || "Belum Tercapai"
            ]);
          }
        });

        // Calculate estimated height
        // 1 Pilar header row takes ~4.5mm, each indicator row takes ~3.8mm under compact padding
        const estimatedHeight = 4.5 + (pilarRows.length - 1) * 3.8;

        // Check if it fits on current page (A4 limitY = 240 to allow space for headers and signatures)
        const limitY = 240;
        if (currentPageY + estimatedHeight > limitY && pages[currentPageIndex].pilars.length > 0) {
          // Push to new page
          pages.push({ pilars: [] });
          currentPageIndex++;
          currentPageY = 20; // Starts at top margin of new page
        }

        pages[currentPageIndex].pilars.push({
          name: pilarName,
          rows: pilarRows,
          estimatedHeight
        });

        currentPageY += estimatedHeight + 2; // Add 2mm spacing between tables
      });

      // 4. Render tables page-by-page
      let globalIndex = 0;
      let isFirstPage = true;

      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const pageGroup = pages[pIdx];
        if (!isFirstPage) {
          doc.addPage();
        }

        let currentY = isFirstPage ? 64 : 20;

        for (let tIdx = 0; tIdx < pageGroup.pilars.length; tIdx++) {
          const pilar = pageGroup.pilars[tIdx];
          
          // Re-generate rows with the proper global index
          const finalRows: any[] = [];
          
          // Add Pilar Header Row
          finalRows.push(pilar.rows[0]);

          // Build rows with correct globalIndex
          const startIdx = 1;
          for (let r = startIdx; r < pilar.rows.length; r++) {
            const originalRow = pilar.rows[r];
            const isParent = originalRow[2] === "" && originalRow[3] === "" && originalRow[4] === "" && originalRow[5] === "";
            const isChild = originalRow[1].startsWith("      ");

            let displayNo = "";
            if (isParent || !isChild) {
              globalIndex++;
              displayNo = globalIndex.toString();
            }

            finalRows.push([
              displayNo,
              originalRow[1],
              originalRow[2],
              originalRow[3],
              originalRow[4],
              originalRow[5]
            ]);
          }

          // Render this Pilar's table
          autoTable(doc, {
            startY: currentY,
            head: tIdx === 0 ? [[
              { content: "NO", styles: { halign: 'center', valign: 'middle', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 } },
              { content: "URAIAN KPI", styles: { halign: 'center', valign: 'middle', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 } },
              { content: getPdfTargetTitleUppercase(), styles: { halign: 'center', valign: 'middle', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 } },
              { content: getPdfRealisasiTitleUppercase(), styles: { halign: 'center', valign: 'middle', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 } },
              { content: "% CAPAIAN", styles: { halign: 'center', valign: 'middle', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 } },
              { content: "STATUS", styles: { halign: 'center', valign: 'middle', fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 } }
            ]] : undefined,
            body: finalRows,
            margin: { top: 15, bottom: 15, left: 20, right: 20 },
            theme: 'grid',
            styles: {
              fontSize: 9,
              cellPadding: { top: 0.8, bottom: 0.8, left: 1.2, right: 1.2 },
              lineColor: [200, 200, 200],
              lineWidth: 0.1,
              font: "times",
              textColor: [0, 0, 0]
            },
            columnStyles: {
              0: { cellWidth: 7, halign: 'center', valign: 'middle' }, // No
              1: { cellWidth: 65, halign: 'left', valign: 'middle' },   // Uraian KPI
              2: { cellWidth: 24, halign: 'center', valign: 'middle' }, // Target
              3: { cellWidth: 24, halign: 'center', valign: 'middle' }, // Realisasi
              4: { cellWidth: 22, halign: 'center', valign: 'middle' }, // % Capaian
              5: { cellWidth: 28, halign: 'center', valign: 'middle', fontStyle: 'bold' }  // Status
            },
            didParseCell: function (data) {
              if (data.row.index >= 0) {
                const isPilarHeader = (data.row.cells[0]?.raw as any)?.colSpan === 6;
                if (isPilarHeader) return;

                const isChild = data.column.index === 1 && data.cell.text[0]?.startsWith("      ");
                if (isChild) {
                  data.cell.styles.textColor = [100, 100, 100];
                }

                if (data.column.index === 5) {
                  const statusText = data.cell.text[0];
                  if (statusText === "Tercapai") {
                    data.cell.styles.textColor = [0, 128, 0];
                  } else if (statusText === "Hampir Tercapai") {
                    data.cell.styles.textColor = [180, 120, 0];
                  } else if (statusText === "Belum Tercapai") {
                    data.cell.styles.textColor = [180, 0, 0];
                  }
                }
              }
            }
          });

          currentY = (doc as any).lastAutoTable.finalY + 2;
        }

        isFirstPage = false;
      }

      // 5. Signature Block Page Allocation (requires ~47mm on A4)
      let finalY = (doc as any).lastAutoTable.finalY || 100;
      if (finalY + 47 > 280) {
        doc.addPage();
        finalY = 20;
      }

      const signatureStartY = finalY + 5; // Spaced beautifully below the table (exactly 5mm)

      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0);

      // Get Indonesian dynamic date for the download
      const getIndonesianDateString = () => {
        const months = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const dateObj = new Date();
        const day = dateObj.getDate();
        const month = months[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        return `Sukabumi, ${day} ${month} ${year}`;
      };
      const formattedDateStr = getIndonesianDateString();

      // Left Column (Mengetahui Wali Kota Sukabumi)
      doc.text("Mengetahui,", 65, signatureStartY, { align: "center" });
      doc.setFont("times", "bold");
      doc.text("WALI KOTA SUKABUMI,", 65, signatureStartY + 5, { align: "center" });

      // Right Column (Date, Direktur UOBK RSUD Al-Mulk Kota Sukabumi)
      doc.setFont("times", "normal");
      doc.text(formattedDateStr, 150, signatureStartY, { align: "center" });
      doc.setFont("times", "bold");
      doc.text("DIREKTUR UOBK RSUD AL-MULK", 150, signatureStartY + 5, { align: "center" });
      doc.text("KOTA SUKABUMI,", 150, signatureStartY + 10, { align: "center" });

      // Names: placed at signatureStartY + 35 (approx 3.5 cm space is plenty for signature)
      const nameY = signatureStartY + 35;

      // Left Name (H. AYEP ZAKI)
      doc.setFont("times", "bold");
      doc.text("H. AYEP ZAKI", 65, nameY, { align: "center" });

      // Right Name (Dr. Deni Purnama, S.Kep., MKM., FISQua)
      const nameText = "Dr. Deni Purnama, S.Kep., MKM., FISQua";
      doc.setFont("times", "bold");
      doc.text(nameText, 150, nameY, { align: "center" });
      
      // Underline right name
      const nameWidth = doc.getTextWidth(nameText);
      doc.setLineWidth(0.3);
      doc.line(150 - nameWidth / 2, nameY + 1, 150 + nameWidth / 2, nameY + 1);

      // Right NIP (NIP. 198011092003121002)
      doc.setFont("times", "normal");
      doc.text("NIP. 198011092003121002", 150, nameY + 6, { align: "center" });

      // 6. Double-pass header stamping for pages > 1 (no page number footer as requested)
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Draw top mini header for pages > 1
        if (i > 1) {
          doc.setFont("times", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(100);
          doc.text("Laporan KPI UOBK RSUD Al-Mulk Kota Sukabumi", 25, 12);
          doc.setLineWidth(0.1);
          doc.line(25, 13, 190, 13);
        }
      }

      // Generate PDF as Blob
      let pdfBlob;
      try {
        pdfBlob = doc.output("blob");
      } catch (genErr) {
        console.error("PDF generation error:", genErr);
        setSnackbar({ message: "Gagal membuat file PDF.", type: "error" });
        setIsDownloadingPdf(false);
        return;
      }

      // Trigger download using Object URL and a temporary <a> tag
      try {
        const fileBlob = new Blob([pdfBlob], { type: "application/pdf" });
        const fileName = `Laporan_KPI_RSUD_Al_Mulk_${filterJenisLaporan}_${getPeriodeString().replace(/\s+/g, '_')}.pdf`;
        downloadUrl = URL.createObjectURL(fileBlob);

        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Revoke after a short delay to allow browser to start the download
        setTimeout(() => {
          if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
          }
        }, 300);

        setSnackbar({ message: "File PDF berhasil diunduh.", type: "success" });
      } catch (dlErr) {
        console.error("PDF download error:", dlErr);
        setSnackbar({ message: "File PDF gagal diunduh. Silakan coba kembali.", type: "error" });
      }
    } catch (err) {
      console.error("Error generating professional PDF:", err);
      setSnackbar({ message: "Gagal membuat file PDF.", type: "error" });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 max-w-[1400px] mx-auto p-4">
        <div className="h-40 bg-white/5 animate-pulse rounded-2xl"></div>
        <div className="h-96 bg-white/5 animate-pulse rounded-2xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 max-w-[1400px] mx-auto print:bg-white print:text-black">
      
      {/* Print Header */}
      <div className="hidden print:block text-center mb-8 pb-4 border-b-2 border-black">
        <h1 className="text-2xl font-bold uppercase">Laporan Kinerja RSUD Al-Mulk</h1>
        <p className="text-sm mt-1">Periode: {filterJenisLaporan} {filterPeriode !== 'Tahunan' ? filterPeriode : ''} - Tahun {filterTahun}</p>
        <p className="text-sm">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden px-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins text-white tracking-tight">
            LAPORAN KPI
          </h1>
          <p className="text-gray-400 mt-1">Pusat pelaporan kinerja terintegrasi secara otomatis</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Keyframes for glowing border animation */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes border-glow {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}} />

          <div className="relative p-[1.5px] overflow-hidden rounded-xl bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] transition-all duration-300">
            {/* Rotating glowing line */}
            <div 
              className="absolute inset-[-1000%] bg-[conic-gradient(from_0deg,transparent_30%,#3b82f6_45%,#60a5fa_50%,#3b82f6_55%,transparent_70%)]"
              style={{
                animation: "border-glow 3s linear infinite"
              }}
            />
            
            {/* Blue glassmorphism button */}
            <button
              onClick={downloadPDF}
              disabled={isDownloadingPdf}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-[10.5px] bg-blue-950/70 hover:bg-blue-900/80 text-blue-100 hover:text-white font-semibold transition-colors backdrop-blur-xl disabled:opacity-50"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <FileText className="w-4 h-4 text-blue-400" />
              )}
              {isDownloadingPdf ? "Sedang membuat PDF..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* A. Panel Filter */}
      <div className="p-5 md:p-6 rounded-2xl glassmorphism border border-white/5 print:hidden">
        <div className="flex items-center gap-2 mb-4 text-white font-semibold">
          <Search className="w-4 h-4 text-primary-cyan" />
          Filter Laporan
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Jenis Laporan</label>
            <select 
              value={filterJenisLaporan} onChange={(e) => setFilterJenisLaporan(e.target.value)}
              className="w-full bg-dark-navy/50 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-cyan"
            >
              {JENIS_LAPORAN.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Periode</label>
            <select 
              value={filterPeriode} onChange={(e) => setFilterPeriode(e.target.value)}
              disabled={filterJenisLaporan === "Tahunan"}
              className="w-full bg-dark-navy/50 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-cyan disabled:opacity-50"
            >
              {filterJenisLaporan === "Triwulan" ? (
                <>
                  <option value="Q1">Triwulan I</option>
                  <option value="Q2">Triwulan II</option>
                  <option value="Q3">Triwulan III</option>
                  <option value="Q4">Triwulan IV</option>
                </>
              ) : filterJenisLaporan === "Semester" ? (
                <>
                  <option value="S1">Semester I</option>
                  <option value="S2">Semester II</option>
                </>
              ) : filterJenisLaporan === "Bulanan" ? (
                MONTHS.map((m, idx) => <option key={idx+1} value={idx+1}>{m}</option>)
              ) : (
                <option value="Tahunan">Sepanjang Tahun</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Tahun</label>
            <select 
              value={filterTahun} onChange={(e) => setFilterTahun(Number(e.target.value))}
              className="w-full bg-dark-navy/50 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-cyan"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Pilar</label>
            <select 
              value={filterPilar} onChange={(e) => setFilterPilar(e.target.value)}
              className="w-full bg-dark-navy/50 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-cyan"
            >
              <option value="Semua">Semua Pilar</option>
              {pilarKpi.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Status</label>
            <select 
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-dark-navy/50 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-cyan"
            >
              <option value="Semua">Semua Status</option>
              <option value="Tercapai">Tercapai</option>
              <option value="Hampir Tercapai">Hampir Tercapai</option>
              <option value="Belum Tercapai">Belum Tercapai</option>
            </select>
          </div>
        </div>
      </div>

      {/* B. Card Tabel Laporan */}
      <div className="rounded-2xl glassmorphism border border-white/5 overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-6 md:p-8 border-b border-white/5 bg-dark-navy/40 print:bg-transparent print:border-none">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-left w-full max-w-3xl mx-auto">
            <div className="w-[80px] h-[62px] sm:w-[96px] sm:h-[75px] flex items-center justify-center shrink-0 print:bg-transparent overflow-hidden">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }} 
                />
              ) : null}
              <Activity className={`w-12 h-12 sm:w-[75px] sm:h-[75px] text-primary-cyan print:text-black ${logoUrl ? 'hidden' : ''}`} />
            </div>
            <div className="flex flex-col items-center sm:items-start justify-center py-2">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white uppercase tracking-wider print:text-black leading-tight">
                LAPORAN KEY PERFORMANCE INDICATOR (KPI)
              </h2>
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-300 uppercase tracking-wide mt-1.5 print:text-black leading-tight">
                UOBK RSUD AL-MULK KOTA SUKABUMI
              </h3>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-primary-cyan mt-2 uppercase print:text-black leading-tight">
                PERIODE {getPeriodeString()}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse print:text-xs min-w-[800px]">
            <thead className="sticky top-0 bg-dark-navy/95 backdrop-blur-sm z-10 print:static print:bg-transparent shadow-sm">
              <tr className="border-b border-white/10 print:border-black uppercase">
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black w-[5%] text-center text-[10px] border-r border-white/10">NO</th>
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black w-[40%] text-center text-[10px] border-r border-white/10">
                  URAIAN KPI
                </th>
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black text-center text-[10px] border-r border-white/10">
                  {getTargetTitle()}
                </th>
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black text-center text-[10px] border-r border-white/10">
                  {getRealisasiTitle()}
                </th>
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black text-center text-[10px] border-r border-white/10">
                  % CAPAIAN
                </th>
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black text-center text-[10px]">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {finalFilteredData.length > 0 ? (
                (() => {
                  const grouped: Record<string, any[]> = {};
                  finalFilteredData.forEach(d => {
                    if (!grouped[d.pilar]) grouped[d.pilar] = [];
                    grouped[d.pilar].push(d);
                  });
                  
                  const pilarNames = pilarKpi.map(p => p.name);
                  const existingPilars = Object.keys(grouped).sort((a, b) => pilarNames.indexOf(a) - pilarNames.indexOf(b));
                  
                  let globalIndex = 0;
                  
                  return existingPilars.map(pilarName => {
                    const rawRows = grouped[pilarName];
                    const tableRows: any[] = [];
                    let addedOptimalisasiAsetParent = false;
                    let addedCrossSellingParent = false;

                    rawRows.forEach((d) => {
                      const rawName = d.nama_indikator || "";
                      if (rawName.startsWith("Jumlah aset yang dimanfaatkan - ")) {
                        if (!addedOptimalisasiAsetParent) {
                          tableRows.push({
                            isParent: true,
                            isChild: false,
                            name: "Jumlah aset yang dimanfaatkan",
                            id: "parent-optimalisasi-aset",
                          });
                          addedOptimalisasiAsetParent = true;
                        }
                        const subName = rawName.replace("Jumlah aset yang dimanfaatkan - ", "");
                        tableRows.push({
                          isParent: false,
                          isChild: true,
                          name: subName,
                          ...d
                        });
                      } else if (rawName.startsWith("Cross selling - ")) {
                        if (!addedCrossSellingParent) {
                          tableRows.push({
                            isParent: true,
                            isChild: false,
                            name: "Cross selling",
                            id: "parent-cross-selling",
                          });
                          addedCrossSellingParent = true;
                        }
                        const subName = rawName.replace("Cross selling - ", "");
                        tableRows.push({
                          isParent: false,
                          isChild: true,
                          name: subName,
                          ...d
                        });
                      } else {
                        tableRows.push({
                          isParent: false,
                          isChild: false,
                          name: rawName,
                          ...d
                        });
                      }
                    });

                    return (
                      <Fragment key={pilarName}>
                        <tr className="bg-white/5 border-b border-white/10 print:bg-gray-100">
                          <td colSpan={6} className="py-2.5 px-4 text-white font-bold text-xs uppercase tracking-wide print:text-black">
                            {pilarName}
                          </td>
                        </tr>
                        {tableRows.map((row) => {
                          let displayNo = "";
                          if (row.isParent) {
                            globalIndex++;
                            displayNo = globalIndex.toString();
                          } else if (!row.isChild) {
                            globalIndex++;
                            displayNo = globalIndex.toString();
                          } else {
                            displayNo = "";
                          }

                          if (row.isParent) {
                            return (
                              <tr key={row.id} className="border-b border-white/5 bg-white/[0.01] hover:bg-white/10 transition-colors print:border-gray-300">
                                <td className="py-3.5 px-4 text-gray-400 print:text-black text-center border-r border-white/10">{displayNo}</td>
                                <td className="py-3.5 px-4 text-white text-sm font-semibold print:text-black pr-8 border-r border-white/10">
                                  <div className="pl-4 text-[13px] mt-0">
                                    {row.name}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-gray-400 text-sm text-center font-mono print:text-black border-r border-white/10">
                                  
                                </td>
                                <td className="py-3.5 px-4 text-gray-400 text-sm text-center font-mono print:text-black border-r border-white/10">
                                  
                                </td>
                                <td className="py-3.5 px-4 text-gray-400 text-sm text-center font-bold font-mono print:text-black border-r border-white/10">
                                  
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="text-gray-400 text-xs"></span>
                                </td>
                              </tr>
                            );
                          }

                          let statusColor = "text-red-400 bg-red-400/10 border-red-400/20";
                          if (row.statusStr === "Tercapai") statusColor = "text-green-400 bg-green-400/10 border-green-400/20";
                          else if (row.statusStr === "Hampir Tercapai") statusColor = "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
                          
                          return (
                            <tr key={row.id} className="border-b border-white/5 hover:bg-white/10 even:bg-white/[0.02] transition-colors print:border-gray-300 print:even:bg-transparent">
                              <td className="py-3.5 px-4 text-gray-400 print:text-black text-center border-r border-white/10">{displayNo}</td>
                              <td className="py-3.5 px-4 text-white text-sm font-medium print:text-black pr-8 border-r border-white/10">
                                <div className={`text-[13px] mt-0 ${row.isChild ? "pl-10 text-gray-300" : "pl-4 border-l-2 border-primary-cyan/30"}`}>
                                  {row.name}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-gray-300 text-sm text-center font-mono print:text-black border-r border-white/10">
                                {row.targetValue.toLocaleString("id-ID", {maximumFractionDigits: 0})}
                              </td>
                              <td className="py-3.5 px-4 text-gray-300 text-sm text-center font-mono print:text-black border-r border-white/10">
                                {row.realisasiValue.toLocaleString("id-ID", {maximumFractionDigits: 0})}
                              </td>
                              <td className="py-3.5 px-4 text-primary-cyan text-sm text-center font-bold font-mono print:text-black border-r border-white/10">
                                {row.progress.toLocaleString("id-ID", {maximumFractionDigits: 0})}%
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wider border ${statusColor} print:border-none print:bg-transparent print:p-0 print:text-black flex items-center justify-center gap-1.5 max-w-fit mx-auto text-center`}>
                                  {row.statusStr === "Tercapai" ? <CheckCircle2 className="w-3 h-3 hidden md:block" /> : 
                                   row.statusStr === "Hampir Tercapai" ? <AlertTriangle className="w-3 h-3 hidden md:block" /> : 
                                   <XCircle className="w-3 h-3 hidden md:block" />}
                                  {row.statusStr}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  });
                })()
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 text-gray-600 mb-3" />
                      <p>Tidak ada data laporan yang sesuai dengan filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* C. Card Ringkasan KPI (Moved to bottom) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 print:hidden">
        <AnimatedStatCard title="Total Indikator" value={tTotal} suffix="" icon={<Target className="w-5 h-5" />} color="text-primary-cyan" bg="bg-primary-cyan/10" border="border-primary-cyan/20" />
        <AnimatedStatCard title="Tercapai" value={tTercapai} suffix="" icon={<CheckCircle2 className="w-5 h-5" />} color="text-primary-green" bg="bg-primary-green/10" border="border-primary-green/20" />
        <AnimatedStatCard title="Belum Tercapai" value={tBelum} suffix="" icon={<AlertTriangle className="w-5 h-5" />} color="text-primary-pink" bg="bg-primary-pink/10" border="border-primary-pink/20" />
        <AnimatedStatCard title="Rata-rata KPI" value={avgKPI} suffix="%" isFloat={true} icon={<Activity className="w-5 h-5" />} color="text-primary-purple" bg="bg-primary-purple/10" border="border-primary-purple/20" />
      </div>

      {/* Snackbar/Toast notifications */}
      <AnimatePresence>
        {snackbar && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border ${
              snackbar.type === "success" 
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-100" 
                : "bg-rose-950/90 border-rose-500/30 text-rose-100"
            } backdrop-blur-xl`}
          >
            <div className={`w-2 h-2 rounded-full ${snackbar.type === "success" ? "bg-emerald-400" : "bg-rose-400"}`} />
            <span className="text-sm font-medium">{snackbar.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog for Empty Data */}
      <AnimatePresence>
        {showNoDataDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNoDataDialog(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3 text-amber-400 mb-4">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <h3 className="text-lg font-bold text-white">Tidak Ada Data</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Tidak ada data yang dapat dibuat menjadi laporan PDF. Silakan periksa kembali filter pencarian Anda atau masukkan data KPI terlebih dahulu.
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowNoDataDialog(false)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function AnimatedStatCard({ title, value, suffix, icon, color, bg, border, isFloat = false }: { title: string, value: number, suffix: string, icon: React.ReactNode, color: string, bg: string, border: string, isFloat?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 1,
      onUpdate: (v) => setDisplayValue(v),
      ease: "easeOut"
    });
    return controls.stop;
  }, [value]);

  return (
    <div className={`p-5 rounded-2xl bg-dark-navy/50 border ${border} shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between glassmorphism relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${bg} rounded-full blur-2xl -translate-y-1/2 translate-x-1/3`} />
      <div className="relative z-10">
        <p className="text-xs text-gray-400 font-medium mb-1">{title}</p>
        <p className={`text-2xl font-bold font-poppins ${color}`}>
          {isFloat ? displayValue.toFixed(2) : Math.round(displayValue)}{suffix}
        </p>
      </div>
      <div className={`p-3 rounded-xl ${bg} ${color} relative z-10`}>
        {icon}
      </div>
    </div>
  );
}
