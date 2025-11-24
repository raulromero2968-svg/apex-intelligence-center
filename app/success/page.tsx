'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

// 1. Create a specialized component for the logic that needs the URL parameters
function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (sessionId) {
      setStatus('confirmed');
      // Optional: You could fetch /api/stripe/checkout?session_id=... here to verify details
    }
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="text-red-400">
        <p>Invalid Request. No Session ID found.</p>
        <Link href="/store" className="text-white hover:underline mt-4 block">Return to Store</Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-8 rounded-lg border border-green-500/30 max-w-md w-full text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-white mb-2">Payment Successful</h1>
      <p className="text-slate-400 mb-6">
        Thank you for your purchase. Your transaction has been secured on the Apex ledger.
      </p>
      <div className="bg-slate-900 p-3 rounded font-mono text-xs text-slate-500 mb-6 break-all">
        Session: {sessionId}
      </div>
      <Link
        href="/store"
        className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-full font-bold transition-all"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

// 2. Wrap the content in a Suspense Boundary in the main default export
export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <Suspense fallback={
        <div className="text-cyan-400 animate-pulse">Verifying Transaction...</div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
