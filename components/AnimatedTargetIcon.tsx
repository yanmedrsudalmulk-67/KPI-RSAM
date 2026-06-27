"use client";

import { motion } from "motion/react";
import { Target } from "lucide-react";

export function AnimatedTargetIcon({ active, className = "" }: { active?: boolean; className?: string }) {
  if (!active) {
    return <Target className={className} />;
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Base target icon */}
      <Target className="relative z-0" />
      
      {/* Animated Arrow Container */}
      <div className="absolute inset-0 z-10 overflow-visible pointer-events-none">
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 text-white w-full h-full drop-shadow-md"
          initial={{ opacity: 0, x: 15, y: -15, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1], x: [15, 0, 0], y: [-15, 0, 0], scale: [0.5, 1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: "easeOut" }}
        >
          {/* Arrow shaft and head */}
          <path d="M22 2 L12 12 M12 12 L16 12 M12 12 L12 8" />
          {/* Feathers crossing the shaft near the tail */}
          <path d="M19 3 L21 5 M18 4 L20 6 M17 5 L19 7" />
        </motion.svg>
      </div>
    </div>
  );
}
