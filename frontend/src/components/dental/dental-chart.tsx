import React, { useState } from 'react';
import { Tooth } from './tooth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DentalChartProps {
  teethData?: Record<number, any>; // Map of tooth number to data
  onToothClick?: (number: number) => void;
}

export function DentalChart({ teethData = {}, onToothClick }: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // FDI Notation
  // Q1: 18-11, Q2: 21-28
  // Q4: 48-41, Q3: 31-38
  
  const quadrants = {
    q1: [18, 17, 16, 15, 14, 13, 12, 11],
    q2: [21, 22, 23, 24, 25, 26, 27, 28],
    q4: [48, 47, 46, 45, 44, 43, 42, 41],
    q3: [31, 32, 33, 34, 35, 36, 37, 38],
  };

  const handleToothClick = (num: number) => {
    setSelectedTooth(num);
    onToothClick?.(num);
  };

  const renderQuadrant = (numbers: number[], label: string) => (
    <div className="flex gap-1 sm:gap-2 justify-center p-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
      {numbers.map(num => (
        <Tooth
          key={num}
          number={num}
          status={teethData[num]?.condition || 'HEALTHY'}
          selected={selectedTooth === num}
          onClick={handleToothClick}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto p-4">
      {/* Upper Arch */}
      <div className="space-y-2">
        <div className="flex justify-center items-center gap-2 mb-2">
           <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Üst Çene (Maxilla)</Badge>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="flex justify-end">{renderQuadrant(quadrants.q1, "Sağ Üst")}</div>
          <div className="flex justify-start">{renderQuadrant(quadrants.q2, "Sol Üst")}</div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative h-px bg-slate-200 w-full flex items-center justify-center">
        <span className="bg-background px-2 text-xs text-slate-400 font-medium">ORTA HAT</span>
      </div>

      {/* Lower Arch */}
      <div className="space-y-2">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="flex justify-end">{renderQuadrant(quadrants.q4, "Sağ Alt")}</div>
          <div className="flex justify-start">{renderQuadrant(quadrants.q3, "Sol Alt")}</div>
        </div>
        <div className="flex justify-center items-center gap-2 mt-2">
           <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Alt Çene (Mandible)</Badge>
        </div>
      </div>
    </div>
  );
}
