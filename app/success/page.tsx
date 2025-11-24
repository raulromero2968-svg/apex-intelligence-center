'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate verification delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-10 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400">Verifying transaction...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Payment Successful</h1>
              <p className="text-slate-400">Your transaction has been processed.</p>
            </div>

            {sessionId && (
              <div className="bg-slate-800 border border-slate-700 rounded p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Session ID</p>
                <p className="text-sm font-mono text-white break-all">{sessionId}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Link
                href="/store"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded font-semibold transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                href="/portfolio"
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded border border-slate-700 transition-colors"
              >
                View Portfolio
              </Link>
            </div>

            <p className="text-xs text-slate-600 pt-4">
              A confirmation email has been sent to your registered address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
