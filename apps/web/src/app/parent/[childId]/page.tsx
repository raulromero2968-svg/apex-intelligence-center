import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { familyLinks, parentalControls, childActivityHistory, watchlistItems, portfolios } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth';
import ParentDashboardClient from './ParentDashboardClient';

export const revalidate = 0; // always fresh for real-time monitoring

interface PageProps {
  params: {
    childId: string;
  };
}

export default async function ParentDashboardPage({ params }: PageProps) {
  const { childId } = params;

  // Get user from cookies (server-side auth)
  const cookieStore = cookies();

  // Simple auth check - replace with your actual auth logic
  // For now, we'll use a mock user ID from cookies
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    redirect('/login');
  }

  // Verify user is parent of this child
  const link = await db.query.familyLinks.findFirst({
    where: and(
      eq(familyLinks.parentId, userId),
      eq(familyLinks.childId, childId),
      eq(familyLinks.status, 'active')
    ),
    with: {
      child: {
        columns: {
          id: true,
          email: true,
          name: true,
        },
      },
      parentalControls: true,
    },
  });

  if (!link) {
    redirect('/parent');
  }

  // Get child's recent activity
  const activities = await db.query.childActivityHistory.findMany({
    where: eq(childActivityHistory.childId, childId),
    orderBy: desc(childActivityHistory.timestamp),
    limit: 50,
  });

  // Get child's watchlist
  const watchlist = await db.query.watchlistItems.findMany({
    where: eq(watchlistItems.userId, childId),
    with: {
      card: true,
    },
  });

  // Get child's portfolios
  const childPortfolios = await db.query.portfolios.findMany({
    where: eq(portfolios.userId, childId),
    with: {
      holdings: {
        with: {
          card: true,
        },
      },
    },
  });

  // Calculate total portfolio value
  let totalPortfolioValue = 0;
  for (const portfolio of childPortfolios) {
    for (const holding of portfolio.holdings) {
      totalPortfolioValue += holding.costBasisUsd * holding.quantity;
    }
  }

  const controls = link.parentalControls?.[0];

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {link.child.name || link.child.email}'s Activity
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Real-time monitoring and parental controls
            </p>
          </div>
          <a
            href="/parent"
            className="px-4 py-2 rounded-lg border border-cyan-500/20 bg-black/40 text-cyan-400 hover:border-cyan-500/40 transition-colors text-sm"
          >
            ← Back to Children
          </a>
        </div>

        {/* Pass data to client component for interactive features */}
        <ParentDashboardClient
          childId={childId}
          childName={link.child.name || link.child.email}
          activities={activities}
          watchlist={watchlist}
          portfolios={childPortfolios}
          totalPortfolioValue={totalPortfolioValue}
          controls={controls}
        />
      </div>
    </main>
  );
}
