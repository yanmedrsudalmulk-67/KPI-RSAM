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
import { motion, animate } from "motion/react";
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
      
      if (targetValue > 0) {
        progress = (realisasiValue / targetValue) * 100;
      } else if (targetTahunan > 0) {
        progress = 0;
      }

      if (progress >= 100) status = "Tercapai";
      else if (progress >= 80) status = "Hampir Tercapai";
      else status = "Belum Tercapai";

      return {
        ...ind,
        targetValue,
        realisasiValue,
        progress: progress > 100 && targetValue > 0 ? 100 : progress,
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
    try {
      const res = await fetch(url);
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

  const getPdfRealisasiTitle = () => {
    if (filterJenisLaporan === "Bulanan") return "Realisasi / \nBulan Ini";
    if (filterJenisLaporan === "Triwulan") return "Realisasi / \nTriwulan";
    if (filterJenisLaporan === "Semester") return "Realisasi / \nSemester";
    return "Realisasi / \nTahun Ini";
  };

  const downloadPDF = async () => {
    setIsDownloadingPdf(true);
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

      // Helper function to draw dynamic header on first page
      const drawFirstPageHeader = () => {
        // Left Logo (Pemkot)
        if (pemkotBase64) {
          doc.addImage(pemkotBase64, "PNG", 20, 16, 18, 22);
        }
        // Right Logo (RS)
        if (rsBase64) {
          doc.addImage(rsBase64, "PNG", 172, 16, 18, 22);
        }

        // Center Text Block
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(headerLine1.toUpperCase(), 105, 20, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(headerLine2.toUpperCase(), 105, 25, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(headerLine3.toUpperCase(), 105, 30, { align: "center" });

        // Address & details wrapping
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        const wrappedAddress = doc.splitTextToSize(headerLine4, 125);
        doc.text(wrappedAddress, 105, 35, { align: "center" });

        // Double Horizontal Line (kop surat style)
        doc.setLineWidth(0.8);
        doc.line(20, 44.5, 190, 44.5);
        doc.setLineWidth(0.25);
        doc.line(20, 46.0, 190, 46.0);
      };

      // Draw the header on the first page
      drawFirstPageHeader();

      // 2. Document Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("LAPORAN KEY PERFORMANCE INDICATOR (KPI)", 105, 54, { align: "center" });
      
      doc.setFontSize(10);
      doc.text(`PERIODE: ${getPeriodeString()}`, 105, 59, { align: "center" });

      // 3. Prepare table rows
      const tableRows: any[] = [];
      const grouped: Record<string, any[]> = {};
      
      finalFilteredData.forEach(d => {
        if (!grouped[d.pilar]) grouped[d.pilar] = [];
        grouped[d.pilar].push(d);
      });

      const pilarNames = pilarKpi.map(p => p.name);
      const existingPilars = Object.keys(grouped).sort((a, b) => pilarNames.indexOf(a) - pilarNames.indexOf(b));

      let globalIndex = 0;

      existingPilars.forEach(pilarName => {
        // Add Pillar Header Row
        tableRows.push([
          {
            content: pilarName.toUpperCase(),
            colSpan: 6,
            styles: {
              fillColor: [242, 242, 242],
              textColor: [0, 0, 0],
              fontStyle: 'bold',
              fontSize: 8.5,
              halign: 'left'
            }
          }
        ]);

        const rawRows = grouped[pilarName];
        
        // Detect sub-groups (e.g. "Jumlah aset yang dimanfaatkan - " or "Cross selling - ")
        const subGroupRows: any[] = [];
        let addedOptimalisasiAsetParent = false;
        let addedCrossSellingParent = false;

        rawRows.forEach((d) => {
          const rawName = d.nama_indikator || "";
          if (rawName.startsWith("Jumlah aset yang dimanfaatkan - ")) {
            if (!addedOptimalisasiAsetParent) {
              subGroupRows.push({
                isParent: true,
                isChild: false,
                name: "Jumlah aset yang dimanfaatkan",
                id: "parent-optimalisasi-aset",
              });
              addedOptimalisasiAsetParent = true;
            }
            const subName = rawName.replace("Jumlah aset yang dimanfaatkan - ", "");
            subGroupRows.push({
              isParent: false,
              isChild: true,
              name: subName,
              ...d
            });
          } else if (rawName.startsWith("Cross selling - ")) {
            if (!addedCrossSellingParent) {
              subGroupRows.push({
                isParent: true,
                isChild: false,
                name: "Cross selling",
                id: "parent-cross-selling",
              });
              addedCrossSellingParent = true;
            }
            const subName = rawName.replace("Cross selling - ", "");
            subGroupRows.push({
              isParent: false,
              isChild: true,
              name: subName,
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

        subGroupRows.forEach((row) => {
          let displayNo = "";
          if (row.isParent) {
            globalIndex++;
            displayNo = globalIndex.toString();
          } else if (!row.isChild) {
            globalIndex++;
            displayNo = globalIndex.toString();
          }

          if (row.isParent) {
            tableRows.push([
              displayNo,
              row.name,
              "",
              "",
              "",
              ""
            ]);
          } else {
            const displayName = row.isChild ? `      ${row.name}` : row.name;
            tableRows.push([
              displayNo,
              displayName,
              row.targetValue.toLocaleString("id-ID", { maximumFractionDigits: 0 }),
              row.realisasiValue.toLocaleString("id-ID", { maximumFractionDigits: 0 }),
              `${Math.round(row.progress)}%`,
              row.statusStr
            ]);
          }
        });
      });

      // 4. Render Table
      autoTable(doc, {
        startY: 65,
        head: [[
          { content: "No", styles: { halign: 'center', fillColor: [230, 230, 230], textColor: [0, 0, 0] } },
          { content: "Uraian KPI", styles: { halign: 'left', fillColor: [230, 230, 230], textColor: [0, 0, 0] } },
          { content: `${getPdfTargetTitle()}`, styles: { halign: 'center', fillColor: [230, 230, 230], textColor: [0, 0, 0] } },
          { content: `${getPdfRealisasiTitle()}`, styles: { halign: 'center', fillColor: [230, 230, 230], textColor: [0, 0, 0] } },
          { content: "% Capaian", styles: { halign: 'center', fillColor: [230, 230, 230], textColor: [0, 0, 0] } },
          { content: "Status", styles: { halign: 'center', fillColor: [230, 230, 230], textColor: [0, 0, 0] } }
        ]],
        body: tableRows,
        margin: { top: 20, bottom: 20, left: 20, right: 20 },
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          font: "helvetica",
          textColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' }, // No
          1: { cellWidth: 80, halign: 'left' },   // Uraian KPI
          2: { cellWidth: 22, halign: 'center' }, // Target
          3: { cellWidth: 22, halign: 'center' }, // Realisasi
          4: { cellWidth: 18, halign: 'center' }, // % Capaian
          5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }  // Status
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
        },
        didDrawPage: function (data) {
          // Top mini header on pages after the first
          if (data.pageNumber > 1) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(100);
            doc.text("Laporan KPI UOBK RSUD Al-Mulk Kota Sukabumi", 20, 12);
            doc.setLineWidth(0.1);
            doc.line(20, 13, 190, 13);
          }
        }
      });

      // 5. Signature Block Page Allocation
      let finalY = (doc as any).lastAutoTable.finalY || 100;
      if (finalY + 55 > 280) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(0);

      doc.text("Mengetahui,", 30, finalY + 15);

      doc.setFont("helvetica", "bold");
      doc.text("WALI KOTA SUKABUMI,", 30, finalY + 20);

      const titleLines = doc.splitTextToSize("DIREKTUR UOBK RSUD AL-MULK\nKOTA SUKABUMI,", 70);
      doc.text(titleLines, 120, finalY + 20);

      doc.setFont("helvetica", "bold");
      doc.text("H. AYEP ZAKI", 30, finalY + 45);

      doc.text("Dr. Deni Purnama, S.Kep., MKM., FISQua", 120, finalY + 45);

      doc.setFont("helvetica", "normal");
      doc.text("NIP. 198011092003121002", 120, finalY + 50);

      // 6. Double-pass page number footer stamping
      const pageCount = doc.internal.pages.length - 1;
      const printedDateStr = new Date().toLocaleDateString("id-ID", {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const printedTimeStr = new Date().toLocaleTimeString("id-ID", {
        hour: '2-digit', minute: '2-digit'
      });

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(120);

        doc.text(`Dicetak: ${printedDateStr}, ${printedTimeStr} oleh Petugas RSUD Al-Mulk`, 20, 287);
        doc.text(`Halaman ${i} dari ${pageCount}`, 190, 287, { align: "right" });
      }

      // Save PDF
      doc.save(`Laporan_KPI_RSUD_Al_Mulk_${filterJenisLaporan}_${getPeriodeString().replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Error generating professional PDF:", err);
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
              {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
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
          <div className="flex items-center justify-center gap-4 text-center w-full max-w-4xl mx-auto">
            <div className="w-[96px] h-[75px] flex items-center justify-center shrink-0 print:bg-transparent overflow-hidden">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="w-[96px] h-[75px] object-contain ml-0 pb-0 mb-0 pt-[1px] pl-0 pr-0 mr-0" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }} 
                />
              ) : null}
              <Activity className={`w-[75px] h-[75px] text-primary-cyan print:text-black ${logoUrl ? 'hidden' : ''}`} />
            </div>
            <div className="flex flex-col items-center justify-center flex-1 max-w-2xl h-[90px] w-[656px] m-0 p-0">
              <h2 className="text-[25px] font-bold text-white uppercase tracking-wider print:text-black text-center h-[28.5px]">LAPORAN KEY PERFORMANCE INDICATOR (KPI)</h2>
              <h3 className="text-[25px] font-bold text-white uppercase tracking-wide mt-1 print:text-black text-center h-[28.5px]">UOBK RSUD AL-MULK KOTA SUKABUMI</h3>
              <p className="text-[20px] font-semibold text-primary-cyan mt-[5px] uppercase print:text-black text-center h-[28px]">
                PERIODE {getPeriodeString()}
              </p>
            </div>
            <div className="w-[96px] h-[75px] shrink-0 hidden md:block"></div> {/* Spacer for perfect centering */}
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse print:text-xs min-w-[800px]">
            <thead className="sticky top-0 bg-dark-navy/95 backdrop-blur-sm z-10 print:static print:bg-transparent shadow-sm">
              <tr className="border-b border-white/10 print:border-black uppercase">
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black w-[5%] text-center text-[12px] border-r border-white/10">NO</th>
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black w-[40%] text-center text-[12px] border-r border-white/10">
                  URAIAN KPI
                </th>
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black text-center text-[11px] border-r border-white/10">
                  {getTargetTitle()}
                </th>
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black text-center text-[11px] border-r border-white/10">
                  {getRealisasiTitle()}
                </th>
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black text-center text-[12px] border-r border-white/10">
                  % CAPAIAN
                </th>
                <th className="py-4 px-4 font-semibold text-gray-300 print:text-black text-center text-[12px]">
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
