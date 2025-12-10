import Link from 'next/link';

// Admin-specific navigation
const ADMIN_NAV = [
  { label: 'Overview', href: '/admin' },
  { label: 'Users & Permissions', href: '/admin/users' },
  { label: 'Content Management', href: '/admin/articles' },
  { label: 'Market Data Stream', href: '/admin/market-data' },
  { label: 'System Health', href: '/admin/health' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* SIDEBAR
        Fixed width, dark border. Only visible on desktop.
        On mobile, you might want to collapse this into a top menu eventually.
      */}
      <aside className="hidden w-64 border-r border-slate-800 bg-slate-950/50 p-6 md:block">
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Control Center
          </h3>
        </div>

        <nav className="space-y-1">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-cyan-950/30 hover:text-cyan-400 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-12 rounded-lg border border-yellow-900/50 bg-yellow-950/10 p-4">
          <p className="text-xs text-yellow-500">
            <strong>Warning</strong><br/>
            Changes made here directly affect the live TCG database.
          </p>
        </div>
      </aside>

      {/* MAIN ADMIN CONTENT */}
      <div className="flex-1 bg-slate-950">
        {children}
      </div>
    </div>
  );
}
