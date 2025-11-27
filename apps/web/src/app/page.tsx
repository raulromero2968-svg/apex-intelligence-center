// apps/web/src/app/page.tsx
import Link from 'next/link';
import { FC } from 'react';

const HomePage: FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Video Background */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover opacity-50 z-0"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/images/titan-loop.mp4" type="video/mp4" />
        {/* Fallback overlay if video fails */}
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50" />
      </video>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 md:px-8">
        {/* System Badge */}
        <div className="absolute top-4 left-4 text-cyan-400 text-sm font-mono">
          ● SYSTEM ONLINE // VER 2.0
        </div>

        {/* Navigation */}
        <nav className="absolute top-4 right-4 flex space-x-4 text-sm font-bold uppercase">
          <Link href="/intel" className="hover:text-cyan-400 transition">Intel</Link>
          <Link href="/portfolio" className="hover:text-cyan-400 transition">Portfolio</Link>
          <Link href="/commons" className="hover:text-cyan-400 transition">Commons</Link>
          <Link href="/about" className="hover:text-cyan-400 transition">About</Link>
          <Link href="/subscribe" className="hover:text-cyan-400 transition">Subscribe</Link>
          <button className="px-4 py-2 border border-white hover:border-cyan-400 hover:text-cyan-400 transition">
            ACCESS_TERMINAL
          </button>
        </nav>

        {/* Title with Styling */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-center">
          <span
            className="text-transparent"
            style={{
              WebkitTextStroke: '2px white',
            }}
          >
            UNDERGROUND
          </span>{' '}
          <span className="text-white font-extrabold">INTEL</span>
        </h1>

        {/* Description */}
        <p className="mt-6 text-center text-slate-400 max-w-2xl text-lg">
          Premium TCG market analysis, data-driven insights, and exclusive intelligence. Morning Brew meets the underground—delivered to your inbox.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex space-x-4">
          <button className="px-6 py-3 bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition">
            GET ALPHA ACCESS
          </button>
          <button className="px-6 py-3 border border-white hover:border-cyan-400 hover:text-cyan-400 transition">
            BROWSE DATABASE
          </button>
        </div>
      </div>

      {/* Subtle Scan Lines Overlay */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-5"
        style={{
          background: 'linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.02) 50%)',
          backgroundSize: '100% 4px'
        }}
      />
    </div>
  );
};

export default HomePage;
