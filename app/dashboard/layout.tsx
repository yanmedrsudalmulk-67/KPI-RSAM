"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Activity, 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Database, 
  LogOut, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FileOutput
} from "lucide-react";
import RSLogo from "@/components/RSLogo";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-transparent text-gray-100 flex font-sans">
      {/* Sidebar Desktop */}
      <aside 
        className={`relative ${
          isCollapsed ? "w-20" : "w-64"
        } hidden md:flex flex-col bg-dark-charcoal/25 backdrop-blur-2xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.3)] h-screen sticky top-0 transition-all duration-150 ease-out will-change-[width]`}
      >


        <div className={`p-6 flex items-center gap-3 border-b border-white/5 transition-all duration-150 ${isCollapsed ? "justify-center px-4" : ""}`}>
          <RSLogo size={isCollapsed ? "small" : "large"} />
          {!isCollapsed && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-150">
              <span className="font-poppins font-bold text-[13px] text-blue-50 tracking-wide drop-shadow-md">
                UOBK RSUD AL-MULK
              </span>
              <span className="font-poppins font-medium text-[11px] text-[#8fff97] tracking-[0.1em] uppercase">
                Kota Sukabumi
              </span>
            </div>
          )}
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            href="/dashboard" 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={pathname === "/dashboard"} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            href="/dashboard/input" 
            icon={<Activity />} 
            label="Target KPI" 
            active={pathname === "/dashboard/input"} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            href="/dashboard/realisasi" 
            icon={<FileText />} 
            label="Realisasi" 
            active={pathname === "/dashboard/realisasi"} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            href="/dashboard/laporan" 
            icon={<FileOutput />} 
            label="Laporan" 
            active={pathname === "/dashboard/laporan"} 
            isCollapsed={isCollapsed}
          />
          <div className="relative">
            <NavItem 
              href="/dashboard/grafik" 
              icon={<BarChart3 />} 
              label="Grafik Analytics" 
              active={pathname === "/dashboard/grafik"} 
              isCollapsed={isCollapsed}
            />
            {/* Toggle Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsCollapsed(!isCollapsed);
              }}
              className="absolute top-1/2 -translate-y-1/2 -right-7 w-6 h-6 rounded-full bg-dark-charcoal border border-white/10 text-gray-400 hover:text-white flex items-center justify-center hover:border-blue-400/50 shadow-lg cursor-pointer transition-all duration-150 z-50 group hover:scale-110"
              title={isCollapsed ? "Tampilkan Sidebar" : "Sembunyikan Sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5 transition-transform duration-150" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5 transition-transform duration-150" />
              )}
            </button>
          </div>
          <NavItem 
            href="/dashboard/master" 
            icon={<Database />} 
            label="Master Data" 
            active={pathname === "/dashboard/master"} 
            isCollapsed={isCollapsed}
          />
          <NavItem 
            href="/dashboard/pengaturan" 
            icon={<Settings />} 
            label="Pengaturan" 
            active={pathname === "/dashboard/pengaturan"} 
            isCollapsed={isCollapsed}
          />
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <NavItem 
            href="/" 
            icon={<LogOut />} 
            label="Keluar" 
            isLogout 
            isCollapsed={isCollapsed}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden pb-24 md:pb-0 relative">
        {/* Mobile Header (Slightly more premium glass effect) */}
        <header className="md:hidden flex items-center justify-between p-4 bg-dark-charcoal/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <RSLogo size="large" />
            <div className="flex flex-col">
              <span className="font-poppins font-bold text-xs text-blue-50 tracking-wide drop-shadow-md">UOBK RSUD AL-MULK</span>
              <span className="font-poppins font-medium text-[8px] text-blue-300/80 tracking-[0.1em] uppercase">Kota Sukabumi</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </div>
        
        {/* Mobile Floating Bottom Navigation */}
        <nav className="md:hidden fixed bottom-6 left-4 right-4 z-40 bg-dark-charcoal/30 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center justify-between p-1.5 px-2">
          <MobileBottomItem href="/dashboard" icon={<LayoutDashboard />} label="Dashboard" active={pathname === "/dashboard"} />
          <MobileBottomItem href="/dashboard/input" icon={<Activity />} label="Target KPI" active={pathname === "/dashboard/input"} />
          <MobileBottomItem href="/dashboard/realisasi" icon={<FileText />} label="Realisasi" active={pathname === "/dashboard/realisasi"} />
          <MobileBottomItem href="/dashboard/grafik" icon={<BarChart3 />} label="Grafik" active={pathname === "/dashboard/grafik"} />
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="relative flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all duration-150 ease-out text-gray-400 hover:text-white hover:bg-white/5"
          >
            <div className={`w-5 h-5 mb-1 flex items-center justify-center transition-all duration-150 ease-out ${isMobileMenuOpen ? "text-white" : ""}`}>
              <Menu className="w-full h-full" />
            </div>
            <span className={`text-[10px] font-medium transition-all duration-150 ease-out ${isMobileMenuOpen ? "text-white opacity-100" : "opacity-70"}`}>Lainnya</span>
          </button>
        </nav>

        {/* Mobile Sliding Menu (Lainnya) */}
        <div className={`md:hidden fixed inset-0 z-50 flex flex-col justify-end transition-all duration-200 ease-out ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {/* Backdrop overlay */}
          <div 
            className={`absolute inset-0 bg-dark-navy/80 backdrop-blur-sm transition-opacity duration-200 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div 
            className={`relative w-full bg-dark-charcoal/40 backdrop-blur-3xl border-t border-white/15 rounded-t-[2.5rem] shadow-[0_-12px_40px_rgba(0,0,0,0.4)] p-6 pb-12 flex flex-col transform transition-transform duration-200 will-change-transform ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}
          >
            {/* Elegant Handlebar */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 flex-shrink-0" />
            
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="font-poppins font-bold text-white text-lg tracking-wide drop-shadow-sm">Menu Lainnya</h3>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 px-1">
              <MobileMenuItem href="/dashboard/master" icon={<Database />} label="Master Data" active={pathname === "/dashboard/master"} onClick={() => setIsMobileMenuOpen(false)} />
              <MobileMenuItem href="/dashboard/pengaturan" icon={<Settings />} label="Pengaturan" active={pathname === "/dashboard/pengaturan"} onClick={() => setIsMobileMenuOpen(false)} />
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 px-1">
              <MobileMenuItem href="/" icon={<LogOut />} label="Keluar" isLogout onClick={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MobileBottomItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      href={href}
      className={`relative flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all duration-150 ease-out ${
        active 
          ? "text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_4px_12px_rgba(37,99,235,0.3)]" 
          : "text-gray-400 hover:text-white hover:bg-white/5 overflow-hidden"
      }`}
    >
      <div className={`w-5 h-5 mb-1 flex items-center justify-center transition-all duration-150 ease-out ${active ? "scale-110 drop-shadow-[0_0_8px_rgba(37,99,235,0.5)] text-white animate-float-icon" : "scale-100"}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium transition-all duration-150 ease-out ${active ? "opacity-100 tracking-wide font-semibold text-white" : "opacity-70 tracking-normal"}`}>{label}</span>
      {active && (
        <span className="absolute bottom-1 -mb-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full bg-blue-400 shadow-[0_-2px_10px_rgba(37,99,235,0.6)]" />
      )}
    </Link>
  );
}

function MobileMenuItem({ href, icon, label, active = false, isLogout = false, onClick }: { href: string, icon: React.ReactNode, label: string, active?: boolean, isLogout?: boolean, onClick?: () => void }) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-150 ease-out ${
        active 
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]" 
          : isLogout
            ? "text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-transparent shadow-sm"
            : "text-gray-300/90 hover:text-white hover:bg-white/5 border border-transparent"
      }`}
    >
      <div className={`w-6 h-6 flex items-center justify-center transition-transform hover:scale-110 ${active ? 'scale-110 drop-shadow-md text-white animate-float-icon' : ''}`}>
        {icon}
      </div>
      <span className={`font-medium ${active ? 'font-semibold tracking-wide text-white' : ''} ${isLogout ? 'text-red-400 font-semibold' : ''}`}>{label}</span>
    </Link>
  );
}

function NavItem({ 
  href, 
  icon, 
  label, 
  active = false, 
  isLogout = false,
  isCollapsed = false
}: { 
  href: string, 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean, 
  isLogout?: boolean,
  isCollapsed?: boolean
}) {
  return (
    <Link 
      href={href}
      className={`flex items-center group relative transition-all duration-150 ease-out will-change-[width] ${
        isCollapsed 
          ? "justify-center w-12 h-12 rounded-xl mx-auto" 
          : "gap-3 px-4 py-3 rounded-xl w-full"
      } ${
        active 
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]" 
          : isLogout
            ? "text-red-400 hover:text-red-300 hover:bg-red-400/10"
            : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <div className={`w-5 h-5 flex items-center justify-center transition-transform duration-150 group-hover:scale-110 ${isCollapsed ? "mr-0" : ""} ${active ? "text-white animate-float-icon" : ""}`}>
        {icon}
      </div>
      
      {!isCollapsed ? (
        <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis transition-opacity duration-150">{label}</span>
      ) : (
        <span className="absolute left-16 bg-dark-navy/80 backdrop-blur-md text-white text-xs font-medium px-2 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap border border-white/10 z-50 shadow-xl">
          {label}
        </span>
      )}
    </Link>
  );
}

