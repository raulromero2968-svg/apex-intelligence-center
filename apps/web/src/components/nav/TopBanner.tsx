'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

// Primary navigation items
const navLinks = [
  { href: '/intel', label: 'INTEL' },
  { href: '/lab', label: 'LAB' },
  { href: '/philosophy', label: 'PHILOSOPHY' },
  { href: '/portfolio', label: 'PORTFOLIO' },
  { href: 'https://www.apexcommons.org', label: 'COMMONS', external: true },
  { href: '/phd-framework', label: 'PHD' },
  { href: '/about', label: 'ABOUT' },
  { href: '/pricing', label: 'PRICING' },
  { href: '/subscribe', label: 'SUBSCRIBE' },
];

// Secondary navigation items (sub-header)
const secondaryNavLinks = [
  { href: '/market', label: 'TCG Market' },
  { href: '/analytics', label: 'Intelligence Stream' },
  { href: '/ecosystem', label: 'Ecosystem' },
  { href: '/admin', label: 'Admin Panel' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/terminal', label: 'Open Terminal' },
];

export const TopBanner = () => {
  const pathname = usePathname() ?? '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 h-16 bg-black/90 backdrop-blur-sm border-b border-cyan-500/20">
        {/* Holographic Electrical Pulse at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-pulse-slide" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-40 animate-pulse-slide-delayed" />
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 opacity-30 blur-sm animate-electric-flow" />
        </div>

        {/* Left: Logo/Brand */}
        <Link href="/" className="flex items-center text-white font-bold tracking-tight font-sans transition-all z-50">
          <Image
            src="/images/apex-wolf-black-bg-final.png"
            width={36}
            height={36}
            alt="Apex Wolf"
            className="rounded-full mr-2 md:mr-3 w-8 h-8 md:w-10 md:h-10"
          />
          {/* Desktop: Single line */}
          <span className="text-prismatic hidden sm:inline text-xl">
            <span className="hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">APEX</span>
            {' '}
            <span className="hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">INTELLIGENCE</span>
          </span>
          {/* Mobile: Two lines stacked */}
          <div className="flex flex-col sm:hidden text-prismatic leading-tight">
            <span className="text-xs hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">APEX</span>
            <span className="text-xs hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">INTELLIGENCE</span>
          </div>
        </Link>

        {/* Center: Nav Links (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            'external' in link && link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium tracking-wide text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {link.label}
              </a>
            ) : (
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
            )
          ))}
        </nav>

        {/* Right: Access Terminal Button + Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/terminal"
            className="btn-tactical inline-flex items-center gap-1 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 font-sans text-xs md:text-sm whitespace-nowrap"
          >
            [ ACCESS_TERMINAL ]
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Secondary Nav Bar (Sub-header) */}
      <div className="fixed top-16 left-0 right-0 z-40 hidden md:block border-b border-white/5 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8 overflow-x-auto">
          {secondaryNavLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap text-[10px] uppercase tracking-wider transition-colors ${
                pathname.startsWith(item.href)
                  ? 'text-white font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-16 left-0 right-0 bg-black/95 border-b border-cyan-500/20 backdrop-blur-md">
            <nav className="flex flex-col py-4">
              {navLinks.map((link) => (
                'external' in link && link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-6 py-3 text-base font-medium tracking-wide transition-colors border-l-4 text-slate-400 hover:text-cyan-400 border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/5"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-6 py-3 text-base font-medium tracking-wide transition-colors border-l-4 ${
                      isActive(link.href)
                        ? 'text-cyan-400 border-cyan-400 bg-cyan-500/10'
                        : 'text-slate-400 hover:text-white border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              ))}

              {/* Secondary nav links in mobile menu */}
              <div className="border-t border-cyan-500/20 mt-4 pt-4">
                <p className="px-6 py-2 text-xs uppercase tracking-wider text-slate-600">Quick Access</p>
                {secondaryNavLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-6 py-3 text-sm font-medium tracking-wide transition-colors border-l-4 ${
                      pathname.startsWith(item.href)
                        ? 'text-cyan-400 border-cyan-400 bg-cyan-500/10'
                        : 'text-slate-500 hover:text-white border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
