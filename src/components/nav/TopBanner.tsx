'use client';

import Image from 'next/image';
import Link from 'next/link';

export const TopBanner = () => {
  return (
    <div className="fixed top-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-md border-b border-cyan-500/20 z-50">
      <div className="container mx-auto h-full flex items-center justify-between px-6">
        {/* Left: Logo + Brand */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image 
            src="/wolf-logo.png" 
            alt="Wolf Logo" 
            width={40} 
            height={40}
            className="w-10 h-10"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold">
              <span className="text-cyan-400">APEX</span>
              <span className="text-white"> INTELLIGENCE</span>
            </span>
            <span className="text-xs text-gray-400">Underground Intel For Serious Collectors</span>
          </div>
        </Link>
        
        {/* Right: Navigation */}
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-white hover:text-cyan-400 transition-colors">Home</Link>
          <Link href="/insights" className="text-white hover:text-cyan-400 transition-colors">Insights</Link>
          <Link href="/blog" className="text-white hover:text-cyan-400 transition-colors">Blog</Link>
          <Link href="/research" className="text-white hover:text-cyan-400 transition-colors">Research</Link>
          <Link href="/about" className="text-white hover:text-cyan-400 transition-colors">About</Link>
          <Link href="/services" className="text-white hover:text-cyan-400 transition-colors">Services</Link>
          <Link 
            href="/subscribe" 
            className="bg-cyan-400 hover:bg-cyan-500 text-black font-bold px-6 py-2 rounded-lg transition-all"
          >
            Subscribe
          </Link>
        </nav>
      </div>
    </div>
  );
};
