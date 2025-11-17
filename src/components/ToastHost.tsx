'use client';
import { useEffect, useState } from 'react';
import type { ToastPayload } from '@/lib/toast-bus';

export default function ToastHost() {
  const [queue, setQueue] = useState<ToastPayload[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      setQueue((q) => [...q, detail]);
      const t = setTimeout(() => setQueue((q) => q.slice(1)), 2500);
      return () => clearTimeout(t);
    }
    window.addEventListener('toast', onToast as any);
    return () => window.removeEventListener('toast', onToast as any);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {queue.map((t, i) => (
        <div key={i} className="rounded-2xl shadow-lg bg-neutral-900/90 text-white px-4 py-3 min-w-[220px] backdrop-blur-sm border border-cyan-500/20">
          <div className="text-sm font-semibold">{t.title}</div>
          {t.description && <div className="text-xs opacity-80">{t.description}</div>}
        </div>
      ))}
    </div>
  );
}
