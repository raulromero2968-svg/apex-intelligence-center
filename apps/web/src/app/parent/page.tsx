import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { familyLinks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

export const revalidate = 0;

export default async function ParentIndexPage() {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    redirect('/login');
  }

  // Get all children linked to this parent
  const children = await db.query.familyLinks.findMany({
    where: eq(familyLinks.parentId, userId),
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

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white">Parent Dashboard</h1>
          <p className="text-white/60 text-sm mt-1">
            Manage and monitor your children's accounts
          </p>
        </div>

        {/* Add Child Button */}
        <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-white">Add Child Account</h2>
              <p className="text-sm text-white/60 mt-1">
                Link a child account using their email address
              </p>
            </div>
            <button
              onClick={() => {
                const email = prompt('Enter child email address:');
                if (email) {
                  fetch('/api/family/link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ childEmail: email }),
                  }).then(() => window.location.reload());
                }
              }}
              className="px-4 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/20 text-cyan-400 hover:border-cyan-500/40 transition-colors"
            >
              + Add Child
            </button>
          </div>
        </div>

        {/* Children List */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-white/90">Linked Children</h2>
          {children.length === 0 ? (
            <div className="rounded-2xl border border-cyan-500/20 bg-black/40 p-12 text-center">
              <div className="text-white/60">No children linked yet</div>
              <p className="text-sm text-white/40 mt-2">
                Click "Add Child" above to link a child account
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((link) => {
                const controls = link.parentalControls?.[0];
                const activeControls = [
                  controls?.bedtimeEnabled && 'Bedtime',
                  controls?.coolDownEnabled && 'Cool Down',
                  controls?.notificationsDisabled && 'Notifications Off',
                ].filter(Boolean);

                return (
                  <Link
                    key={link.id}
                    href={`/parent/${link.childId}`}
                    className="rounded-2xl border border-cyan-500/20 bg-black/40 p-6 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-medium text-white">
                          {link.child.name || 'Unnamed'}
                        </div>
                        <div className="text-sm text-white/60 mt-1">
                          {link.child.email}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              link.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                            }`}
                          ></div>
                          <span className="text-xs text-white/60 capitalize">
                            {link.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/40">Active Controls</div>
                        <div className="text-cyan-400 font-medium mt-1">
                          {activeControls.length}
                        </div>
                      </div>
                    </div>
                    {activeControls.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {activeControls.map((control) => (
                          <span
                            key={control}
                            className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-400 text-xs"
                          >
                            {control}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Info Section */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">How It Works</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>
                Link your child's account by entering their email address
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>
                Monitor their watchlist, portfolio value, and trading activity in real-time
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>
                Set bedtime hours to prevent trading during specific times
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>
                Enable cool down mode to enforce waiting periods between trades
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>
                Disable all notifications with one click
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span className="font-semibold text-white">
                Children cannot disable parental controls
              </span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
