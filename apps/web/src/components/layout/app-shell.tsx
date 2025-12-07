'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  Home,
  Search,
  Zap,
  Library,
  User,
} from 'lucide-react';

/**
 * AppShell - The Core Application Wrapper
 *
 * Provides:
 * - Bottom mobile navigation (Thumb Zone optimized)
 * - Arc Reactor button (primary CTA)
 * - Safe area handling for notched devices
 *
 * Philosophy:
 * - Mobile-first: Bottom nav is iOS App Store standard
 * - The "Arc Reactor" (center button) is the ONLY glowing element
 * - Everything else is subdued to make the CTA unmissable
 */

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/discover', icon: Search, label: 'Discover' },
  { href: '/transform', icon: Zap, label: 'Scan', isCenter: true },
  { href: '/library', icon: Library, label: 'Library' },
  { href: '/profile', icon: User, label: 'Profile' },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen pb-20 md:pb-0">
      {/* Main Content */}
      <div className="flex-1">{children}</div>

      {/* Bottom Mobile Navigation - Thumb Zone */}
      <nav
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-slate-950/95 backdrop-blur-xl',
          'border-t border-slate-800/50',
          'md:hidden' // Hide on desktop
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            // The Arc Reactor (Center Button)
            if (item.isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative -mt-6 group"
                  aria-label={item.label}
                >
                  {/* Outer Glow Ring */}
                  <div className="absolute inset-0 rounded-full bg-[#00F0FF]/20 blur-xl scale-150 group-hover:bg-[#00F0FF]/30 transition-colors" />

                  {/* The Button */}
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className={clsx(
                      'relative flex items-center justify-center',
                      'w-14 h-14 rounded-full',
                      'bg-gradient-to-br from-[#00F0FF] to-cyan-400',
                      'shadow-[0_0_20px_rgba(0,240,255,0.5)]',
                      'hover:shadow-[0_0_30px_rgba(0,240,255,0.7)]',
                      'transition-shadow duration-300'
                    )}
                  >
                    {/* Inner Ring (Arc Reactor aesthetic) */}
                    <div className="absolute inset-1 rounded-full border-2 border-white/30" />

                    {/* Icon */}
                    <Icon className="w-6 h-6 text-black" strokeWidth={2.5} />
                  </motion.div>

                  {/* Pulse Animation */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#00F0FF]"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </Link>
              );
            }

            // Standard Nav Items
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center justify-center',
                  'w-16 h-12 rounded-lg',
                  'transition-colors duration-200',
                  isActive
                    ? 'text-[#00F0FF]'
                    : 'text-slate-500 hover:text-slate-300'
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default AppShell;
