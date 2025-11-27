/**
 * Vault Report Page
 * 
 * Displays individual Vault report for authenticated users with access.
 */

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getUserFromRequest } from '@/lib/auth';
import { userHasVaultAccess } from '@/server/services/entitlements';
import { headers, cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import SectionShell from '../../(sections)/SectionShell';
import { getVaultReportBySlug, getAllVaultReportSlugs } from '@/lib/vault';
import { Calendar, Lock } from 'lucide-react';
import Link from 'next/link';

interface VaultReportPageProps {
  params: { slug: string };
}

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
 * Generate static params for all vault reports
 */
export async function generateStaticParams() {
  const slugs = await getAllVaultReportSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: VaultReportPageProps) {
  const report = await getVaultReportBySlug(params.slug);

  if (!report) {
    return {
      title: 'Vault Report Not Found',
    };
  }

  return {
    title: report.frontmatter.title,
    description: report.frontmatter.summary,
    openGraph: {
      title: report.frontmatter.title,
      description: report.frontmatter.summary,
      type: 'article',
      publishedTime: report.frontmatter.publishedAt,
    },
  };
}

/**
 * Report Header Component
 */
function ReportHeader({ report }: { report: any }) {
  const publishDate = new Date(report.frontmatter.publishedAt).toLocaleDateString(
    'en-US',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  return (
    <header className="mb-8 space-y-4">
      <div className="flex items-center gap-2 text-sm text-cyan-400 mb-4">
        <Link
          href="/vault"
          className="hover:text-cyan-300 transition-colors"
        >
          The Vault
        </Link>
        <span className="text-white/40">/</span>
        <span className="text-white/60">Report</span>
      </div>

      <h1 className="text-4xl font-bold text-white">{report.frontmatter.title}</h1>

      <div className="flex items-center gap-4 text-sm text-white/60">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <time dateTime={report.frontmatter.publishedAt}>{publishDate}</time>
        </div>
      </div>

      {report.frontmatter.summary && (
        <p className="text-lg text-white/70 mt-4">{report.frontmatter.summary}</p>
      )}
    </header>
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
        This report is part of The Vault premium research newsletter. Upgrade your
        subscription to access weekly insights on arbitrage opportunities, on-chain data
        analysis, and Project O marketplace intelligence.
      </p>
      <Link
        href={getCheckoutUrl()}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors"
      >
        Upgrade to Access The Vault
      </Link>
    </div>
  );
}

/**
 * Main Vault Report Page
 */
export default async function VaultReportPage({ params }: VaultReportPageProps) {
  // Get user from request
  const headersList = await headers();
  const cookiesList = await cookies();
  
  // Construct NextRequest-like object for getUserFromRequest
  const request = new NextRequest('http://localhost', {
    headers: headersList,
  });
  
  // Set cookie in request headers for getUserFromRequest
  const cookieToken = cookiesList.get('accessToken')?.value;
  if (cookieToken) {
    request.headers.set('cookie', `accessToken=${cookieToken}`);
  }
  
  const user = await getUserFromRequest(request);

  if (!user) {
    redirect('/login');
  }

  // Check Vault access
  const hasAccess = await userHasVaultAccess(user.id);

  if (!hasAccess) {
    return (
      <SectionShell title="The Vault" kicker="Premium Research Newsletter">
        <AccessDenied />
      </SectionShell>
    );
  }

  // Load report
  const report = await getVaultReportBySlug(params.slug);

  if (!report) {
    return notFound();
  }

  return (
    <SectionShell title={report.frontmatter.title} kicker="The Vault">
      <article className="max-w-4xl mx-auto">
        <ReportHeader report={report} />

        {/* MDX Content */}
        <Suspense
          fallback={
            <div className="prose prose-invert max-w-none">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
              </div>
            </div>
          }
        >
          <div className="prose prose-invert max-w-none">{report.content}</div>
        </Suspense>
      </article>
    </SectionShell>
  );
}

