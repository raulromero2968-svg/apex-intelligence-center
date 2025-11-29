interface TerminalSectionProps {
  command: string;
  status?: 'running' | 'complete' | 'pending';
  children: React.ReactNode;
}

export default function TerminalSection({
  command,
  status = 'complete',
  children
}: TerminalSectionProps) {
  const statusIndicators = {
    running: { color: 'text-yellow-400', symbol: '⟳', pulse: true },
    complete: { color: 'text-green-400', symbol: '✓', pulse: false },
    pending: { color: 'text-gray-400', symbol: '○', pulse: false }
  };

  const indicator = statusIndicators[status];

  return (
    <div className="my-8">
      <div className="border border-cyan-500/30 bg-black/80 rounded-lg overflow-hidden font-sans">
        {/* Terminal Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 to-transparent">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="text-cyan-400 text-sm tracking-wide">
            apex-intelligence-center
          </div>
        </div>

        {/* Terminal Command */}
        <div className="px-4 py-3 bg-black/60">
          <div className="flex items-center gap-3">
            <span className={`${indicator.color} text-lg ${indicator.pulse ? 'animate-pulse' : ''}`}>
              {indicator.symbol}
            </span>
            <span className="text-gray-400">$</span>
            <span className="text-cyan-300">{command}</span>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="px-4 py-6 text-gray-200 prose prose-invert prose-cyan max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}
