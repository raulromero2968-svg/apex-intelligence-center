interface PublishedTimeProps {
  time: string;
}

export default function PublishedTime({ time }: PublishedTimeProps) {
  return (
    <div className="my-4 inline-flex items-center gap-2 text-sm text-white/70">
      <span className="inline-flex h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
      <span className="tracking-wide uppercase text-xs text-white/60">Updated {time}</span>
    </div>
  );
}


