'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export const TopBanner = () => {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname() ?? '';

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/intelligence', label: 'Intelligence', dataTour: 'nav-intelligence' },
    { href: '/blog', label: 'Blog' },
    { href: '/research', label: 'Research' },
    { href: '/tools', label: 'Tools', dataTour: 'nav-tools' },
    { href: '/about', label: 'About' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed top-[28px] left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-b border-cyan-500/20 z-50">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left: Logo + Brand */}
        <Link
          href="/"
          className="flex items-center gap-3"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Image
            src="/wolf-logo.png"
            alt="Apex Intelligence Center - TCG Market Intelligence Platform Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-lg font-bold">
            <span className="text-cyan-400">APEX</span>
            <span className={`transition-colors ${isHovered ? 'text-cyan-400' : 'text-white'}`}> INTELLIGENCE</span>
          </span>
        </Link>

        {/* Right: Navigation */}
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-tour={link.dataTour}
              className={`transition-colors text-sm ${
                isActive(link.href)
                  ? 'text-cyan-400 font-semibold'
                  : 'text-white hover:text-cyan-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/subscribe"
            className="bg-cyan-400 hover:bg-cyan-500 text-black font-bold px-5 py-2 rounded-lg transition-all text-sm"
          >
            Subscribe
          </Link>
        </nav>
      </div>
    </div>
  );
};
