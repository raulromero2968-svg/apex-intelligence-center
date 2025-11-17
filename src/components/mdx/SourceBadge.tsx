interface SourceBadgeProps {
  count: number;
}

export default function SourceBadge({ count }: SourceBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
      <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
      <span>{count} validated sources</span>
    </div>
  );
}

