'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/intel', label: 'INTEL' },
  { href: '/portfolio', label: 'PORTFOLIO' },
  { href: '/commons', label: 'COMMONS' },
  { href: '/about', label: 'ABOUT' },
  { href: '/subscribe', label: 'SUBSCRIBE' },
];

export const TopBanner = () => {
  const pathname = usePathname() ?? '';

  // Hide TopBanner on homepage - it has its own navigation
  if (pathname === '/') {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-[100] flex items-center justify-between px-6 md:px-12 py-6 bg-black backdrop-blur-md border-b border-cyan-900/30">
      {/* Left: Logo/Brand */}
      <Link href="/" className="flex items-center text-white font-bold text-xl tracking-tight font-mono hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">
        <Image
          src="/images/apex-wolf-black-bg-final.png"
          width={40}
          height={40}
          alt="Apex Wolf"
          className="rounded-full mr-3"
        />
        <span className="text-prismatic">APEX INTELLIGENCE</span>
      </Link>

      {/* Center: Nav Links (hidden on mobile) */}
      <nav className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium tracking-wide transition-colors ${
              isActive(link.href)
                ? 'text-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right: Access Terminal Button - Tactical Style */}
      <Link
        href="/dashboard"
        className="btn-tactical inline-flex items-center gap-2 px-4 py-2 font-mono text-sm"
      >
        [ ACCESS_TERMINAL ]
      </Link>
    </header>
  );
};
