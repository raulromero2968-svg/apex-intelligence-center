import { Sparkles } from 'lucide-react';

interface VARCInsightProps {
  children: React.ReactNode;
  type?: 'bullish' | 'bearish' | 'neutral';
}

export default function VARCInsight({ children, type = 'neutral' }: VARCInsightProps) {
  const typeStyles = {
    bullish: {
      border: 'border-green-500/40',
      bg: 'bg-green-500/5',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.15)]',
      icon: 'text-green-400'
    },
    bearish: {
      border: 'border-red-500/40',
      bg: 'bg-red-500/5',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
      icon: 'text-red-400'
    },
    neutral: {
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-500/5',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.15)]',
      icon: 'text-cyan-400'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className={`my-6 relative border ${styles.border} ${styles.bg} ${styles.glow} rounded-lg p-6 backdrop-blur-sm`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <div className={`relative ${styles.icon}`}>
            <Sparkles size={24} className="animate-pulse" />
            <div className="absolute inset-0 blur-md opacity-50">
              <Sparkles size={24} />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-gray-400 font-mono mb-2">
            [ VARC ANALYSIS ]
          </div>
          <div className="text-gray-200 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
