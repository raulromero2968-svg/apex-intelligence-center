'use client';
import { useEffect, useState } from 'react';

export default function Storefront() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/stripe/product')
      .then(res => res.json())
      .then(data => setProducts(data.products || []));
  }, []);

  const buyProduct = async (priceId: string, connectedAccountId: string) => {
    if (!connectedAccountId) return alert('Error: Seller not linked correctly.');

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId, connectedAccountId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-10 font-sans">
      <header className="mb-10 border-b border-slate-800 pb-4">
        <h1 className="text-4xl font-bold text-white tracking-tight">Apex Market</h1>
        <p className="text-slate-400 mt-2">Institutional-grade TCG assets.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all rounded-lg overflow-hidden group">
            <div className="h-40 bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-slate-800/80 transition-colors">
              {/* Placeholder for VARC Scan Image */}
              [Card Image Placeholder]
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{product.description}</p>

              <div className="flex justify-between items-center mt-4">
                <span className="text-2xl font-mono text-cyan-400">
                  ${(product.default_price.unit_amount / 100).toFixed(2)}
                </span>

                <button
                  onClick={() => buyProduct(product.default_price.id, product.metadata.connected_account_id)}
                  className="bg-white text-slate-900 hover:bg-cyan-400 px-4 py-2 rounded-sm font-bold text-sm uppercase tracking-wide transition-colors"
                >
                  Purchase
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-600 font-mono">
                Seller ID: {product.metadata.connected_account_id || 'Apex-Direct'}
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <p className="text-slate-500">No assets listed. Go to /connect to list an item.</p>
        )}
      </div>
    </div>
  );
}
