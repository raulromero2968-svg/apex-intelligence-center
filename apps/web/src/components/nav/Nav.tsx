'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Alternative minimal Nav component with active link highlighting.
 * Use this if you want a simpler navigation without the TopBanner styling.
 */
export default function Nav() {
  const pathname = usePathname() ?? '';

  const links = [
    { href: '/', label: 'Home' },
    { href: '/insights', label: 'Insights' },
    { href: '/research', label: 'Research' },
    { href: '/about', label: 'About' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-cyan-500/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-cyan-400">
            APEX INTELLIGENCE
          </Link>
          <ul className="flex items-center gap-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-cyan-400'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
