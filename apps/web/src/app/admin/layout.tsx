import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
interface AdminLayoutProps {
  children: React.ReactNode;
}

async function isAdmin() {
  const flag = cookies().get('admin')?.value;
  return flag === '1';
}

const navLinks = [
  { href: '/admin/cache', label: 'Cache' },
  { href: '/admin/equilibrium', label: 'Equilibrium' },
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const ok = await isAdmin();
  if (!ok) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Admin</p>
            <h1 className="text-2xl font-semibold">Systems Command</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-cyan-400/60 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
      </div>
      {children}
    </div>
  );
}

