interface DataCalloutProps {
  metric: string;
  label: string;
  trend?: '↑' | '↓' | '→';
  confidence?: number;
}

export default function DataCallout({
  metric,
  label,
  trend,
  confidence
}: DataCalloutProps) {
  const trendColors = {
    '↑': 'text-green-400',
    '↓': 'text-red-400',
    '→': 'text-gray-400'
  };

  return (
    <div className="my-6 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300" />
      <div className="relative border border-cyan-500/30 bg-black/60 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/50 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-5xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500 mb-2">
              {metric}
            </div>
            <div className="text-sm uppercase tracking-wider text-gray-300 font-sans">
              {label}
            </div>
            {confidence && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 w-24 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-500"
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-cyan-400 font-sans">
                  {(confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            )}
          </div>
          {trend && (
            <div className={`text-4xl font-bold ${trendColors[trend]}`}>
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
