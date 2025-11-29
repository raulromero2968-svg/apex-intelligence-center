'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/intel', label: 'INTEL' },
  { href: '/lab', label: 'LAB' },
  { href: '/philosophy', label: 'PHILOSOPHY' },
  { href: '/portfolio', label: 'PORTFOLIO' },
  { href: '/commons', label: 'COMMONS' },
  { href: '/phd-framework', label: 'PHD' },
  { href: '/about', label: 'ABOUT' },
  { href: '/pricing', label: 'PRICING' },
  { href: '/subscribe', label: 'SUBSCRIBE' },
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
        <Link href="/" className="flex items-center text-white font-bold tracking-tight font-mono transition-all z-50">
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
            <span className="text-[11px] hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">APEX</span>
            <span className="text-[11px] hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">INTELLIGENCE</span>
          </div>
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

        {/* Right: Access Terminal Button + Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/dashboard"
            className="btn-tactical inline-flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 font-mono text-[9px] md:text-sm whitespace-nowrap"
          >
            <span className="hidden sm:inline">[ ACCESS_TERMINAL ]</span>
            <span className="sm:hidden">[ TERM ]</span>
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
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
