import React from 'react';
import { cn } from "@/lib/utils";

interface ToothProps {
  number: number;
  selected?: boolean;
  status?: 'HEALTHY' | 'DECAYED' | 'FILLED' | 'MISSING' | 'IMPLANT' | 'CROWN' | 'ROOT_CANAL';
  onClick?: (number: number) => void;
  className?: string;
}

export function Tooth({ number, selected, status = 'HEALTHY', onClick, className }: ToothProps) {
  // Determine color based on status
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DECAYED': return 'fill-red-400';
      case 'FILLED': return 'fill-blue-400';
      case 'MISSING': return 'fill-gray-200 opacity-20';
      case 'IMPLANT': return 'fill-purple-400';
      case 'CROWN': return 'fill-yellow-400';
      case 'ROOT_CANAL': return 'fill-green-400';
      default: return 'fill-white'; // Healthy
    }
  };

  const statusColor = getStatusColor(status);

  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105",
        selected && "scale-110",
        className
      )}
      onClick={() => onClick?.(number)}
    >
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 drop-shadow-sm">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Root/Base - Simplified visual */}
          {status === 'IMPLANT' && (
             <path d="M40,100 L60,100 L60,120 L40,120 Z" fill="#9333ea" />
          )}
          
          {/* Tooth Shape - 5 Surfaces */}
          <g stroke="currentColor" strokeWidth="2" className={selected ? "stroke-primary" : "stroke-slate-300"}>
            {/* Top (Buccal/Labial) */}
            <path d="M0,0 L100,0 L80,20 L20,20 Z" className={statusColor} />
            {/* Right (Distal) */}
            <path d="M100,0 L100,100 L80,80 L80,20 Z" className={statusColor} />
            {/* Bottom (Lingual/Palatal) */}
            <path d="M100,100 L0,100 L20,80 L80,80 Z" className={statusColor} />
            {/* Left (Mesial) */}
            <path d="M0,100 L0,0 L20,20 L20,80 Z" className={statusColor} />
            {/* Center (Occlusal/Incisal) */}
            <rect x="20" y="20" width="60" height="60" className={statusColor} />
          </g>

          {/* Missing Indicator (X) */}
          {status === 'MISSING' && (
            <path d="M10,10 L90,90 M90,10 L10,90" stroke="red" strokeWidth="5" />
          )}
        </svg>
      </div>
      <span className={cn(
        "text-xs font-bold px-1.5 py-0.5 rounded",
        selected ? "bg-primary text-primary-foreground" : "text-slate-500 bg-slate-100"
      )}>
        {number}
      </span>
    </div>
  );
}
