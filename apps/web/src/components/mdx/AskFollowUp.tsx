'use client';

import { MessageCircle } from 'lucide-react';

interface AskFollowUpProps {
  question?: string;
  children?: React.ReactNode;
}

export default function AskFollowUp({ question, children }: AskFollowUpProps) {
  return (
    <div className="my-6 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 flex gap-3">
      <MessageCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-cyan-400 mb-1">Follow-up Question</p>
        <p className="text-white/80">
          {question || children}
        </p>
      </div>
    </div>
  );
}

