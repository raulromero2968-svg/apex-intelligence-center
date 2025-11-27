/**
 * Vault List Page
 * 
 * Displays list of available Vault reports for authenticated users with access.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUserFromRequest } from '@/lib/auth';
import { userHasVaultAccess } from '@/server/services/entitlements';
import { headers, cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import SectionShell from '../(sections)/SectionShell';
import Link from 'next/link';
import { Calendar, Lock, ArrowRight } from 'lucide-react';
import { getAllVaultReports } from '@/lib/vault';

/**
 * Get Stripe checkout URL for upgrading
 */
function getCheckoutUrl(): string {
  const requiredPlanId = process.env.VAULT_REQUIRED_PLAN;
  if (!requiredPlanId) {
    return '/subscribe';
  }
  return `/subscribe?plan=${requiredPlanId}`;
}

/**
 * Vault Reports List Component
 */
async function VaultReportsList() {
  const reports = await getAllVaultReports();

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">No reports available yet.</p>
        <p className="text-white/40 text-sm mt-2">
          Weekly reports will appear here once published.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => {
        const publishDate = new Date(report.frontmatter.publishedAt).toLocaleDateString(
          'en-US',
          {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }
        );

        return (
          <Link
            key={report.slug}
            href={`/vault/${report.slug}`}
            className="group block p-6 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 bg-black/40 backdrop-blur-sm transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                {report.frontmatter.title}
              </h3>
              <ArrowRight className="w-5 h-5 text-cyan-400/60 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>

            <p className="text-white/70 mb-4 line-clamp-3">
              {report.frontmatter.summary}
            </p>

            <div className="flex items-center gap-2 text-sm text-white/50">
              <Calendar className="w-4 h-4" />
              <time dateTime={report.frontmatter.publishedAt}>{publishDate}</time>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Access Denied Component
 */
function AccessDenied() {
  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <Lock className="w-16 h-16 text-cyan-400/60 mx-auto mb-6" />
      <h2 className="text-3xl font-bold text-white mb-4">Vault Access Required</h2>
      <p className="text-white/70 mb-8">
        The Vault is a premium research newsletter featuring weekly insights on arbitrage
        opportunities, on-chain data analysis, and Project O marketplace intelligence.
      </p>
      <Link
        href={getCheckoutUrl()}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors"
      >
        Upgrade to Access The Vault
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}

/**
 * Main Vault Page
 */
export default async function VaultPage() {
  // Get user from request
  const headersList = await headers();
  const cookiesList = await cookies();
  
  // Construct NextRequest-like object for getUserFromRequest
  const request = new NextRequest('http://localhost', {
    headers: headersList,
  });
  
  // Manually set cookies since NextRequest constructor doesn't accept cookies
  // We'll need to access cookies directly via the cookies() function
  // For now, let's use a workaround by checking cookies directly
  const cookieToken = cookiesList.get('accessToken')?.value;
  if (cookieToken) {
    // Set cookie in request headers for getUserFromRequest
    request.headers.set('cookie', `accessToken=${cookieToken}`);
  }
  
  const user = await getUserFromRequest(request);

  if (!user) {
    redirect('/login');
  }

  // Check Vault access
  const hasAccess = await userHasVaultAccess(user.id);

  return (
    <SectionShell title="The Vault" kicker="Premium Research Newsletter">
      {hasAccess ? (
        <Suspense
          fallback={
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-white/5 rounded-lg animate-pulse"
                />
              ))}
            </div>
          }
        >
          <VaultReportsList />
        </Suspense>
      ) : (
        <AccessDenied />
      )}
    </SectionShell>
  );
}


