'use client';

import { FC, ReactNode } from 'react';

interface HoloCardProps {
  title: string;
  description: string;
  category: 'FREE INTEL' | 'ELITE INTEL' | 'PRO INTEL' | 'DIGITAL SCROLL' | 'ELECTRONIC FOLDER';
  readTime?: string;
  date?: string;
  className?: string;
  children?: ReactNode;
  variant?: 'cyan' | 'purple';
}

/**
 * HoloCard - Transparent glassmorphism card component
 *
 * Features:
 * - bg-black/30 with backdrop-blur for see-through glass effect
 * - Allows matrix/starfield background visibility
 * - Low opacity to avoid performance hits
 * - Fallback to bg-black/50 for browsers without backdrop-blur support
 */
const HoloCard: FC<HoloCardProps> = ({
  title,
  description,
  category,
  readTime,
  date,
  className = '',
  children,
  variant = 'cyan'
}) => {
  const borderColor = variant === 'cyan'
    ? 'border-cyan-400/30 hover:border-cyan-400/60'
    : 'border-purple-400/30 hover:border-purple-400/60';

  const shadowColor = variant === 'cyan'
    ? 'shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)]'
    : 'shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:shadow-[0_0_50px_rgba(168,85,247,0.4)]';

  const categoryGradient = variant === 'cyan'
    ? 'from-cyan-400 to-purple-600'
    : 'from-purple-600 to-cyan-400';

  const titleClass = variant === 'cyan' ? 'font-titan' : 'font-titan-purple';

  const indicatorColor = variant === 'cyan' ? 'bg-cyan-400' : 'bg-purple-400';

  return (
    <div
      className={`
        group relative p-6 rounded-xl
        bg-black/30 backdrop-blur-md
        border ${borderColor}
        ${shadowColor}
        transition-all duration-300
        ${className}
      `}
      /* Fallback for browsers without backdrop-blur support */
      style={{
        // @ts-expect-error CSS @supports fallback
        '@supports not (backdrop-filter: blur(12px))': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      {/* Top gradient accent line - visible on hover */}
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${categoryGradient} rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Category badge */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide">
          <span className={`w-2 h-2 ${indicatorColor} rounded-full animate-pulse`} />
          <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${categoryGradient} text-white`}>
            {category}
          </span>
        </div>
      </div>

      {/* Title with prismatic gradient effect */}
      <h3 className={`text-xl md:text-2xl mb-2 ${titleClass} cyber-text`}>
        {title}
      </h3>

      {/* Description with cyber stream effect */}
      <p className="text-slate-400 text-sm leading-relaxed mb-4 cyber-text">
        {description}
      </p>

      {/* Children slot for custom content */}
      {children}

      {/* Metadata footer */}
      {(readTime || date) && (
        <div className="flex justify-between items-center text-xs text-slate-500 mt-4 pt-4 border-t border-slate-800/50">
          {readTime && <span>{readTime}</span>}
          {date && <span>{date}</span>}
        </div>
      )}
    </div>
  );
};

export default HoloCard;
