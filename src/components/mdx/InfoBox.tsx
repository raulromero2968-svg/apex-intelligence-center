import clsx from 'clsx';
import { Info, AlertTriangle, Star } from 'lucide-react';
import type { ReactNode } from 'react';

type InfoBoxProps = {
  title?: string;
  variant?: 'info' | 'warning' | 'insight';
  children: ReactNode;
};

const variantStyles = {
  info: {
    icon: Info,
    container: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-50',
  },
  warning: {
    icon: AlertTriangle,
    container: 'border-amber-400/40 bg-amber-500/10 text-amber-50',
  },
  insight: {
    icon: Star,
    container: 'border-purple-400/40 bg-purple-500/10 text-purple-50',
  },
} as const;

export default function InfoBox({
  title = 'Insight',
  variant = 'info',
  children,
}: InfoBoxProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      className={clsx(
        'my-8 rounded-2xl border px-4 py-3 text-sm shadow-[0_0_30px_rgba(0,0,0,0.35)]',
        styles.container
      )}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <Icon size={16} />
        {title}
      </div>
      <div className="leading-relaxed text-white/90">{children}</div>
    </div>
  );
}
