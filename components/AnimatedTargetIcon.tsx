import { Target } from "lucide-react";
import React from "react";

interface AnimatedTargetIconProps {
  active?: boolean;
}

export function AnimatedTargetIcon({ active }: AnimatedTargetIconProps) {
  return (
    <div className={`relative flex items-center justify-center ${active ? 'text-white' : 'text-gray-400 group-hover:text-white transition-colors duration-200'}`}>
      <Target className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
      {active && (
        <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
      )}
    </div>
  );
}
