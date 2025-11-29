'use client';

import { AlertTriangle, Clock } from 'lucide-react';

interface RiskClockProps {
  systemName: string;
  minutesToMidnight: number;
  description: string;
}

/**
 * Civilizational Risk Clock
 *
 * Inspired by the Bulletin of the Atomic Scientists' Doomsday Clock.
 * Visualizes how close a specific system is to "Midnight" (Collapse/Irreversibility).
 *
 * @example
 * ```tsx
 * <RiskClock
 *   systemName="Rentism Trajectory"
 *   minutesToMidnight={2}
 *   description="IP consolidation accelerating. Market power concentration at critical levels."
 * />
 * ```
 */
export const RiskClock = ({ systemName, minutesToMidnight, description }: RiskClockProps) => {
  // Calculate clock hand rotation (midnight = 0 degrees, each minute = 6 degrees backwards)
  const minuteHandRotation = 360 - (minutesToMidnight * 6);

  // Determine severity level for styling
  const getSeverityStyles = () => {
    if (minutesToMidnight <= 2) {
      return {
        border: 'border-red-900/50',
        accent: 'border-l-red-500',
        text: 'text-red-500',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        pulse: 'animate-pulse',
      };
    }
    if (minutesToMidnight <= 5) {
      return {
        border: 'border-orange-900/50',
        accent: 'border-l-orange-500',
        text: 'text-orange-500',
        glow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]',
        pulse: '',
      };
    }
    return {
      border: 'border-amber-900/50',
      accent: 'border-l-amber-500',
      text: 'text-amber-500',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.15)]',
      pulse: '',
    };
  };

  const severity = getSeverityStyles();

  return (
    <div
      className={`
        relative rounded-xl bg-slate-950
        border ${severity.border} ${severity.accent} border-l-4
        ${severity.glow}
        transition-all duration-300
      `}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Clock Face */}
        <div className="relative flex items-center justify-center h-16 w-16 rounded-full border-2 border-slate-800 bg-slate-900">
          {/* Clock tick marks */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-1 bg-slate-600"
                style={{
                  top: '4px',
                  left: '50%',
                  transformOrigin: '50% 28px',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`,
                }}
              />
            ))}
          </div>

          {/* Midnight marker (12 o'clock) */}
          <div
            className={`absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 ${severity.text} bg-current`}
          />

          {/* Minute hand */}
          <div
            className={`absolute w-0.5 h-5 ${severity.text} bg-current rounded-full ${severity.pulse}`}
            style={{
              bottom: '50%',
              left: '50%',
              transformOrigin: 'bottom center',
              transform: `translateX(-50%) rotate(${minuteHandRotation}deg)`,
            }}
          />

          {/* Center dot */}
          <div className={`absolute w-2 h-2 rounded-full ${severity.text} bg-current`} />

          {/* Clock icon overlay */}
          <Clock className={`${severity.text} opacity-20`} size={24} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className={`text-xs font-mono uppercase tracking-widest ${severity.text} flex items-center gap-2`}>
            <AlertTriangle size={12} className={severity.pulse} />
            Civilizational Risk Metric
          </div>
          <h3 className="font-bold text-slate-100 text-lg">{systemName}</h3>
          <p className="text-sm text-slate-400">
            <span className={`${severity.text} font-bold`}>{minutesToMidnight} Minutes</span> to Midnight.
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default RiskClock;
