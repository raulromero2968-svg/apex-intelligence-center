import { ReactNode } from 'react';
import { Info } from 'lucide-react';

interface InfoBoxProps {
  children: ReactNode;
}

export default function InfoBox({ children }: InfoBoxProps) {
  return (
    <div className="my-6 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-6 backdrop-blur-sm">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <Info className="w-5 h-5 text-cyan-400 mt-0.5" />
        </div>
        <div className="flex-1 text-white/80 prose prose-invert prose-sm max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}
