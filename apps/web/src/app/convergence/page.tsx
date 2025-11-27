import { redirect } from 'next/navigation';
import { getUserFromRequest } from '@/lib/auth';
import { headers } from 'next/headers';
import { createServerCaller } from '@/server/api/trpc';
import ConvergenceDashboard from '@/components/convergence/ConvergenceDashboard';
import type { ConvergenceSnapshot } from '@apex/shared';
import type { NextRequest } from 'next/server';

async function getSnapshot(): Promise<ConvergenceSnapshot | null> {
  try {
    const headersList = headers();
    const req = {
      headers: headersList,
    } as NextRequest;

    const caller = await createServerCaller(req as any);
    const snapshot = await caller.convergence.getSnapshot({});
    return snapshot;
  } catch (error) {
    console.error('[convergence] Error fetching snapshot:', error);
    return null;
  }
}

export default async function ConvergencePage() {
  const headersList = headers();
  const user = await getUserFromRequest({
    headers: headersList,
  } as any);

  if (!user?.id) {
    redirect('/subscribe');
  }

  const snapshot = await getSnapshot();

  if (!snapshot) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Convergence Dashboard</h1>
          <p className="text-gray-400">Unable to load portfolio data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Convergence Dashboard</h1>
      <ConvergenceDashboard snapshot={snapshot} />
    </div>
  );
}


