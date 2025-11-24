'use client';

import { useEffect, useRef } from 'react';

export function HeroVideoBanner() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      // 1. SLOW DOWN VIDEO (Reduces Seasickness)
      videoRef.current.playbackRate = 0.6;
    }
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-[85vh] z-0 overflow-hidden pointer-events-none">

      {/* 2. VIDEO LAYER */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-80 animate-fade-loop"
      >
        <source src="/images/titan-loop.mp4" type="video/mp4" />
      </video>

      {/* 3. GRADIENT MASKS (Soft Transitions) */}

      {/* Bottom Fade (Blends into the black page) */}
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent" />

      {/* Top Fade (Makes header readable) */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#020617]/90 to-transparent" />

      {/* 4. SCANLINE OVERLAY (Reduces motion perception) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none" />

    </div>
  );
}
