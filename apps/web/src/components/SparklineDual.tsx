'use client';

import * as React from 'react';

type Props = {
  hits: number[];
  misses: number[];
  width?: number; // ≤ 180
  height?: number; // ≤ 40
  className?: string;
};

function toPath(values: number[], w: number, h: number, pad = 2): string | null {
  const n = values.length;
  if (!n) return null;
  const max = Math.max(1, ...values); // avoid divide-by-zero
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const step = n > 1 ? innerW / (n - 1) : 0;
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = pad + step * i;
    const y = pad + (innerH - (values[i] / max) * innerH); // invert
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d;
}

export default function SparklineDual({
  hits,
  misses,
  width = 160,
  height = 36,
  className,
}: Props) {
  const w = Math.min(width, 180);
  const h = Math.min(height, 40);

  const dHits = React.useMemo(() => toPath(hits, w, h), [hits, w, h]);
  const dMiss = React.useMemo(() => toPath(misses, w, h), [misses, w, h]);

  return (
    <div className={className}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
        {dMiss && (
          <path
            d={dMiss}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeOpacity={0.4}
            strokeDasharray="2 2"
          />
        )}
        {dHits && <path d={dHits} fill="none" stroke="currentColor" strokeWidth={1.25} />}
      </svg>
      <div className="mt-1 text-[10px] leading-none whitespace-nowrap text-white/60">
        <span className="align-middle">• hits</span>
        <span className="mx-2 align-middle opacity-40">• misses</span>
      </div>
    </div>
  );
}

