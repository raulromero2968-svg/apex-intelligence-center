/**
 * Dashboard Layout with Minor Protection Banner
 *
 * Displays a persistent banner for minor accounts explaining their
 * permanent free tier status and feature restrictions.
 */

import { cookies } from 'next/headers';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import MinorBanner from '@/components/MinorBanner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get user from cookies/auth
  let isMinor = false;
  let userName: string | null = null;

  try {
    // In a real app, you'd get the user from session/cookies
    // This is a simplified example
    const cookieStore = cookies();
    const authCookie = cookieStore.get('auth-token');

    if (authCookie) {
      // Decode JWT and get user info
      // For now, we'll just check if we can find a user
      // In production, you'd properly decode the JWT
      const userId = cookieStore.get('user-id')?.value;

      if (userId) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            isMinor: true,
            name: true,
          },
        });

        if (user) {
          isMinor = user.isMinor;
          userName = user.name;
        }
      }
    }
  } catch (error) {
    console.error('[DashboardLayout] Error checking user minor status:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isMinor && <MinorBanner userName={userName} />}
      <div className="container mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
