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

  // Show TopBanner on all pages including homepage for consistent fixed nav
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="relative flex flex-col w-full bg-black/90 backdrop-blur-md border-b border-cyan-900/30">
      {/* Top Row: Logo + Access Terminal Button */}
      <div className="flex items-center justify-between px-6 md:px-12 h-14 md:h-16">
        {/* Left: Logo/Brand */}
        <Link href="/" className="flex items-center text-white font-bold text-sm md:text-lg tracking-widest font-mono hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">
          <Image
            src="/images/apex-wolf-black-bg-final.png"
            width={24}
            height={24}
            alt="Apex Wolf"
            className="w-6 h-6 md:w-8 md:h-8 rounded-full mr-2 md:mr-3"
          />
          <span className="text-prismatic">APEX INTELLIGENCE</span>
        </Link>

        {/* Center: Nav Links (Desktop Only) */}
        <div className="hidden md:flex items-center gap-8">
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
        </div>

        {/* Right: Access Terminal Button - Tactical Style */}
        <Link
          href="/dashboard"
          className="btn-tactical inline-flex items-center gap-2 text-[10px] md:text-sm px-2 py-1 md:px-5 md:py-2 font-mono"
        >
          <span className="hidden md:inline">[ </span>ACCESS_TERMINAL<span className="hidden md:inline"> ]</span>
        </Link>
      </div>

      {/* Bottom Row: Mobile Horizontal Scrollable Nav (Mobile Only) */}
      <div className="md:hidden w-full overflow-x-auto flex items-center gap-6 px-4 py-3 scrollbar-hide border-t border-cyan-900/20">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs font-medium tracking-wide transition-colors whitespace-nowrap ${
              isActive(link.href)
                ? 'text-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};
