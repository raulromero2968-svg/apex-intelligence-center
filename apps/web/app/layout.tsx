// apps/web/app/layout.tsx - Root layout for standalone pages (KB-04 patterns)
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../src/styles/animations.css';
import '../src/app/globals.css';

export const metadata: Metadata = {
  title: 'Apex Intelligence',
  description: 'TCG Intelligence Platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
