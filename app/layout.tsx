import type { Metadata } from "next";
import { Inter, Poppins, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import BackgroundDecorations from "@/components/BackgroundDecorations";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const robotoCondensed = Roboto_Condensed({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-roboto-condensed",
});

export const metadata: Metadata = {
  title: "KPI Dashboard - UOBK RSUD AL-MULK",
  description:
    "Enterprise Hospital Key Performance Indicator Monitoring System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${robotoCondensed.variable} dark`}
    >
      <body
        className="font-sans antialiased bg-[#020617] text-gray-100 min-h-screen selection:bg-[#8B5CF6] selection:text-white"
        suppressHydrationWarning
      >
        <BackgroundDecorations />
        {children}
      </body>
    </html>
  );
}
