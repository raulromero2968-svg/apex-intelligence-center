'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export const TopBanner = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-b border-cyan-500/20 z-50">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left: Logo + Brand (pushed to leftmost edge) */}
        <Link 
          href="/" 
          className="flex items-center gap-3"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Image 
            src="/wolf-logo.png" 
            alt="Wolf Logo" 
            width={32} 
            height={32}
            className="w-8 h-8"
          />
          <span className="text-lg font-bold">
            <span className="text-cyan-400">APEX</span>
            <span className={`transition-colors ${isHovered ? 'text-cyan-400' : 'text-white'}`}> INTELLIGENCE</span>
          </span>
        </Link>
        
        {/* Right: Navigation (pushed to rightmost edge) */}
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-white hover:text-cyan-400 transition-colors text-sm">Home</Link>
          <Link href="/insights" className="text-white hover:text-cyan-400 transition-colors text-sm">Insights</Link>
          <Link href="/blog" className="text-white hover:text-cyan-400 transition-colors text-sm">Blog</Link>
          <Link href="/research" className="text-white hover:text-cyan-400 transition-colors text-sm">Research</Link>
          <Link href="/about" className="text-white hover:text-cyan-400 transition-colors text-sm">About</Link>
          <Link href="/services" className="text-white hover:text-cyan-400 transition-colors text-sm">Services</Link>
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
