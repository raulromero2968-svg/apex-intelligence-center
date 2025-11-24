'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WolfConstellation } from '@/components/ui/WolfConstellation';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/intel', label: 'Intel' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/commons', label: 'Commons' },
    { href: '/about', label: 'About' },
    { href: '/subscribe', label: 'Subscribe' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 relative">
             <WolfConstellation className="w-full h-full text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-lg tracking-tighter leading-none">APEX</span>
            <span className="text-cyan-500 text-[10px] tracking-[0.2em] uppercase leading-none">INTELLIGENCE</span>
          </div>
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs font-bold uppercase tracking-widest hover:text-cyan-400 transition-colors ${pathname === item.href ? 'text-cyan-400' : 'text-slate-400'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* TERMINAL ACCESS BUTTON */}
        <div className="hidden md:block">
          <Link href="/subscribe" className="px-6 py-2 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 text-[10px] font-mono uppercase tracking-widest transition-all hover:bg-cyan-950/30">
            [ ACCESS_TERMINAL ]
          </Link>
        </div>

      </div>
    </nav>
  );
}
