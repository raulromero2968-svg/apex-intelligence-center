// app/wallet/page.tsx
export default function WalletPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold md:text-3xl">Wallet &amp; Positions</h1>
        <p className="mt-3 text-sm text-zinc-300">
          Connect a wallet, show card holdings, open positions, and P&amp;L.
        </p>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <p className="text-zinc-400 mb-4">No wallet connected</p>
          <button className="rounded-full border border-zinc-700 px-6 py-2 text-sm font-medium hover:border-cyan-400 hover:text-cyan-300 transition-all">
            Connect Wallet
          </button>
        </div>
      </div>
    </main>
  );
}
