'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/intel', label: 'INTEL' },
  { href: '/lab', label: 'LAB' },
  { href: '/portfolio', label: 'PORTFOLIO' },
  { href: '/commons', label: 'COMMONS' },
  { href: '/about', label: 'ABOUT' },
  { href: '/subscribe', label: 'SUBSCRIBE' },
];

export const TopBanner = () => {
  const pathname = usePathname() ?? '';

  // Show TopBanner on all pages including homepage for consistent fixed nav
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex items-center justify-between px-4 md:px-8 h-16">
      {/* Left: Logo/Brand */}
      <Link href="/" className="flex items-center text-white font-bold text-base md:text-xl tracking-tight font-mono hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">
        <Image
          src="/images/apex-wolf-black-bg-final.png"
          width={36}
          height={36}
          alt="Apex Wolf"
          className="rounded-full mr-2 md:mr-3 w-8 h-8 md:w-10 md:h-10"
        />
        <span className="text-prismatic hidden sm:inline">APEX INTELLIGENCE</span>
        <span className="text-prismatic sm:hidden">APEX</span>
      </Link>

      {/* Center: Nav Links (hidden on mobile) */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8">
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

      {/* Right: Access Terminal Button - Tactical Style (responsive) */}
      <Link
        href="/dashboard"
        className="btn-tactical inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 font-mono text-[10px] md:text-sm"
      >
        <span className="hidden sm:inline">[ ACCESS_TERMINAL ]</span>
        <span className="sm:hidden">[ TERMINAL ]</span>
      </Link>
    </nav>
  );
};

