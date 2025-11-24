'use client';

import { useEffect, useRef } from 'react';

export function HeroVideoBanner() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Slow down for "Cinematic" feel, reduces seasickness
      videoRef.current.playbackRate = 0.6;
    }
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-[85vh] z-0 overflow-hidden pointer-events-none">

      {/* VIDEO LAYER (With CSS Fade Mask) */}
      <div className="absolute inset-0 video-fade">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-80"
        >
          {/* Ensure this file is in public/images/ */}
          <source src="/images/titan-loop.mp4" type="video/mp4" />
        </video>
      </div>

      {/* SCANLINE OVERLAY (Tech Texture) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] opacity-30" />

      {/* BOTTOM GRADIENT (Seamless blend into page) */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#020617] to-transparent" />
    </div>
  );
}
