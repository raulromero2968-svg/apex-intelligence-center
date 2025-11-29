/**
 * RiskClock - Civilizational Risk Assessment Display
 *
 * Inspired by the Bulletin of the Atomic Scientists' "Doomsday Clock",
 * this component visualizes systemic risk with urgency and gravitas.
 *
 * The clock hand points toward midnight (12 o'clock = catastrophe).
 * The fewer minutes to midnight, the closer we are to systemic failure.
 *
 * @module RiskClock
 */

'use client';

import { AlertTriangle, Clock } from 'lucide-react';

interface RiskClockProps {
  systemName: string; // e.g. "Rentism Trajectory"
  minutesToMidnight: number; // e.g. 2.5
  trend: 'stable' | 'accelerating' | 'decelerating';
}

export const RiskClock = ({ systemName, minutesToMidnight, trend }: RiskClockProps) => {
  // Visual logic: Calculate rotation based on minutes (0 = midnight/vertical)
  // 15 mins = 90 deg. 0 mins = 0 deg.
  const rotation = -1 * (minutesToMidnight * 6);

  return (
    <div className="bg-slate-950 border-l-4 border-red-900 shadow-2xl overflow-hidden relative rounded-xl">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <AlertTriangle size={120} className="text-red-500" />
      </div>

      <div className="flex items-center gap-6 p-6 relative z-10">
        {/* The Clock Face */}
        <div className="relative w-24 h-24 rounded-full border-4 border-slate-800 bg-slate-900 flex items-center justify-center shadow-inner">
          {/* Minute Hand */}
          <div
            className="absolute w-1 h-10 bg-red-600 origin-bottom rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"
            style={{
              bottom: '50%',
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 1s ease-out'
            }}
          />
          {/* Center Pin */}
          <div className="w-3 h-3 bg-slate-100 rounded-full z-20 border-2 border-slate-900" />

          {/* Tick Marks (Visual Flourish) */}
          <div className="absolute top-2 w-0.5 h-2 bg-slate-700" />
          <div className="absolute right-2 h-0.5 w-2 bg-slate-700" />
        </div>

        {/* The Data */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-500 font-mono text-xs uppercase tracking-[0.2em] font-bold">
            <Clock size={12} />
            Systemic Risk Assessment
          </div>
          <h2 className="text-2xl font-bold text-slate-100">{systemName}</h2>
          <div className="text-lg font-mono text-slate-400">
            <span className="text-red-500 font-bold text-2xl">{minutesToMidnight}</span> Minutes to Midnight
          </div>
          <div className="text-xs text-slate-500 font-mono uppercase mt-2">
            Trend: <span className={trend === 'accelerating' ? 'text-red-400' : trend === 'decelerating' ? 'text-emerald-400' : 'text-yellow-400'}>{trend}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskClock;
