import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { readKeySeries } from '@/lib/cache';
import SparklineDual from '@/components/SparklineDual';

export const revalidate = 0; // always fresh

/**
 * Simple admin guard
 * Replace with your actual NextAuth/session logic
 */
async function isAdmin() {
  const c = cookies().get('admin')?.value;
  return c === '1';
}

// Common cache keys to monitor
const MONITORED_KEYS = [
  'col:list:eyJwdWJsaWMiOnRydWV9', // collections:public:list
  'search:eyJxIjoicGlrYWNodSJ9', // search?q=pikachu
  'search:eyJzb3VyY2VzIjpbInRjZ3BsYXllciJdfQ', // search?sources=tcgplayer
];

export default async function Page() {
  const ok = await isAdmin();
  if (!ok) redirect('/');

  // Read cache metrics for monitored keys
  const metricsMap = new Map<string, { hits: number[]; misses: number[] }>();
  await Promise.all(
    MONITORED_KEYS.map(async (k) => metricsMap.set(k, await readKeySeries(k, 30)))
  );

  return (
    <main className="p-6 space-y-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-white">Cache Dashboard</h1>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white/90">Cache Metrics</h2>
          <span className="text-[10px] text-white/40 whitespace-nowrap">last 30 minutes (UTC)</span>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6 space-y-4">
          {MONITORED_KEYS.map((k) => {
            const series = metricsMap.get(k) ?? {
              hits: Array(30).fill(0),
              misses: Array(30).fill(0),
            };
            const displayKey = k.split(':')[0] + ':' + (k.length > 40 ? '...' : k.split(':')[1]);
            return (
              <div key={k} className="flex items-center justify-between gap-4">
                <span className="truncate text-xs font-mono text-white/70 flex-1">
                  {displayKey}
                </span>
                <SparklineDual hits={series.hits} misses={series.misses} />
              </div>
            );
          })}
          {MONITORED_KEYS.length === 0 && (
            <div className="text-sm text-white/60 text-center py-4">
              No cache activity yet. Start using the API to see metrics.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white/90">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-4">
            <div className="text-sm text-white/60">Redis Status</div>
            <div className="text-2xl font-semibold text-cyan-400 mt-1">
              {process.env.UPSTASH_REDIS_REST_URL ? 'Connected' : 'Disabled'}
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-4">
            <div className="text-sm text-white/60">Sentry Status</div>
            <div className="text-2xl font-semibold text-cyan-400 mt-1">
              {process.env.SENTRY_DSN ? 'Active' : 'Disabled'}
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-4">
            <div className="text-sm text-white/60">Cache Mode</div>
            <div className="text-2xl font-semibold text-cyan-400 mt-1">
              Tag-based ISR
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white/90">Cache Tags</h2>
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6">
          <div className="space-y-3 text-sm font-mono">
            <div className="flex items-center gap-3">
              <code className="text-cyan-400">collection:&lt;slug&gt;</code>
              <span className="text-white/60">Single collection details & items</span>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-cyan-400">collections:public:list</code>
              <span className="text-white/60">List of public collections</span>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-cyan-400">item:&lt;id&gt;</code>
              <span className="text-white/60">Individual item cache</span>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-cyan-400">source:&lt;name&gt;</code>
              <span className="text-white/60">Search cache per provider</span>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-cyan-400">search</code>
              <span className="text-white/60">Global search fallback</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white/90">Configuration</h2>
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/60">Next.js Version</span>
            <span className="text-white font-mono">14.2.x</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Runtime</span>
            <span className="text-white font-mono">Edge (search), Node (actions)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Sentry Trace Sampling</span>
            <span className="text-white font-mono">Server: 10%, Client: 5%</span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white/90">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href="/api/search?q=pikachu&sources=tcgplayer"
            target="_blank"
            className="rounded-xl border border-cyan-500/20 bg-black/40 p-4 hover:border-cyan-500/40 transition-colors"
          >
            <div className="text-white font-medium">Test Search API</div>
            <div className="text-xs text-white/60 mt-1">Opens in new tab, check Network DevTools</div>
          </a>
          <a
            href="https://docs.sentry.io"
            target="_blank"
            className="rounded-xl border border-cyan-500/20 bg-black/40 p-4 hover:border-cyan-500/40 transition-colors"
          >
            <div className="text-white font-medium">Sentry Dashboard</div>
            <div className="text-xs text-white/60 mt-1">View traces and errors</div>
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
        <h3 className="text-lg font-semibold text-yellow-400 mb-2">Setup Required</h3>
        <p className="text-white/80 text-sm mb-4">
          This is a minimal admin dashboard. To enable full functionality:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-white/70">
          <li>Configure Redis credentials in <code className="text-cyan-400">.env</code></li>
          <li>Set up Sentry DSN and org/project</li>
          <li>Implement authentication for <code className="text-cyan-400">/admin</code> routes</li>
          <li>Deploy database with Drizzle migrations</li>
          <li>Run backfill scripts for existing data</li>
        </ol>
      </section>
    </main>
  );
}

