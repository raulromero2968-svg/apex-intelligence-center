'use client';
import { useState } from 'react';

export default function ConnectDashboard() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');

  // 1. Create Account Handler
  const createAccount = async () => {
    const res = await fetch('/api/stripe/account', { method: 'POST' });
    const data = await res.json();
    if (data.accountId) {
      setAccountId(data.accountId);
      localStorage.setItem('apex_demo_account_id', data.accountId); // Persist for demo
    }
  };

  // 2. Onboard Handler
  const startOnboarding = async () => {
    if (!accountId) return;
    const res = await fetch('/api/stripe/onboard', {
      method: 'POST',
      body: JSON.stringify({ accountId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  // 3. Check Status Handler
  const checkStatus = async () => {
    const id = accountId || localStorage.getItem('apex_demo_account_id');
    if (!id) return;
    setAccountId(id);

    const res = await fetch(`/api/stripe/status?accountId=${id}`);
    const data = await res.json();
    setStatus(data);
  };

  // 4. Create Product Handler
  const createProduct = async () => {
    if (!accountId) return alert('Please create an account first');
    await fetch('/api/stripe/product', {
      method: 'POST',
      body: JSON.stringify({
        name: productName,
        description: 'Verified by VARC Scan', // Branding touch
        priceInCents: parseInt(price) * 100, // Convert to cents
        connectedAccountId: accountId,
      }),
    });
    alert('Product Created! Check the Storefront.');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-10 font-sans">
      <h1 className="text-3xl font-bold text-cyan-400 mb-8">Seller Dashboard</h1>

      {/* Section 1: Account Management */}
      <div className="bg-slate-800 p-6 rounded-lg mb-8 border border-slate-700">
        <h2 className="text-xl font-semibold mb-4">1. Merchant Onboarding</h2>

        <div className="space-y-4">
          {!accountId && (
            <button
              onClick={createAccount}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded transition-all"
            >
              Initialize Seller Account
            </button>
          )}

          {accountId && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Account ID: <span className="font-mono text-white">{accountId}</span></p>

              <div className="flex gap-4">
                <button
                  onClick={startOnboarding}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Onboard to Collect Payments
                </button>
                <button
                  onClick={checkStatus}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded border border-slate-600"
                >
                  Refresh Status
                </button>
              </div>

              {status && (
                <div className="mt-4 p-4 bg-slate-900 rounded border border-cyan-900/50">
                  <h3 className="text-cyan-400 text-sm font-bold uppercase mb-2">Account Health</h3>
                  <ul className="text-sm space-y-1">
                    <li>Details Submitted: {status.details_submitted ? '✅' : '❌'}</li>
                    <li>Charges Enabled: {status.charges_enabled ? '✅' : '❌'}</li>
                    <li>Payouts Enabled: {status.payouts_enabled ? '✅' : '❌'}</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Product Creation */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-semibold mb-4">2. List Asset for Sale</h2>
        <div className="grid gap-4 max-w-md">
          <input
            placeholder="Card Name (e.g., Charizard 1st Ed)"
            className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Price (USD)"
            className="w-full bg-slate-900 border border-slate-600 p-2 rounded text-white"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button
            onClick={createProduct}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-semibold"
          >
            Create Product Listing
          </button>
        </div>
      </div>
    </div>
  );
}
