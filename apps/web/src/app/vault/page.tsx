import { redirect } from 'next/navigation';
import { getUserFromRequest } from '@/lib/auth';
import { userHasVaultAccess } from '@/server/services/entitlements';
import Link from 'next/link';
import { headers } from 'next/headers';

interface VaultReport {
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
}

/**
 * Vault List Page
 * 
 * Displays all available Vault reports.
 * Requires authentication and Vault subscription.
 */
export default async function VaultPage() {
  const headersList = await headers();
  const request = new Request('http://localhost', {
    headers: headersList,
  });

  // Check authentication
  const user = await getUserFromRequest(request);
  if (!user) {
    redirect('/subscribe?redirect=/vault');
  }

  // Check Vault access
  const hasAccess = await userHasVaultAccess(user.id);
  if (!hasAccess) {
    redirect('/subscribe?plan=vault&redirect=/vault');
  }

  // Fetch reports from API
  let reports: VaultReport[] = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/vault/list`, {
      headers: {
        Cookie: headersList.get('cookie') || '',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      reports = data.reports || [];
    }
  } catch (error) {
    console.error('[Vault] Error fetching reports:', error);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">The Vault</h1>
          <p className="text-white/70 text-lg">
            Weekly research reports synthesizing on-chain data, physical scans, and arbitrage insights.
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="border border-cyan-400/50 rounded-lg p-12 bg-black/40 text-center">
            <p className="text-white/70 mb-4">No reports available yet.</p>
            <p className="text-sm text-white/50">
              Weekly reports are generated automatically. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Link
                key={report.slug}
                href={`/vault/${report.slug}`}
                className="border border-cyan-400/50 rounded-lg p-6 bg-black/40 hover:border-cyan-400 transition-colors group"
              >
                <h2 className="text-xl font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                  {report.title}
                </h2>
                {report.summary && (
                  <p className="text-sm text-white/70 mb-4 line-clamp-3">
                    {report.summary}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>
                    {new Date(report.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-cyan-400 group-hover:text-cyan-300">
                    Read →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


