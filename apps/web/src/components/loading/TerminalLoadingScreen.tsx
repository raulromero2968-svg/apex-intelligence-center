'use client';

import { useEffect, useState } from 'react';

interface TerminalLoadingScreenProps {
  onComplete?: () => void;
  duration?: number; // in milliseconds
}

export function TerminalLoadingScreen({ onComplete, duration = 3000 }: TerminalLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('INITIALIZING');

  useEffect(() => {
    const loadingStages = [
      { text: 'INITIALIZING', percent: 0 },
      { text: 'ESTABLISHING SECURE CONNECTION', percent: 25 },
      { text: 'AUTHENTICATING CREDENTIALS', percent: 50 },
      { text: 'LOADING INTELLIGENCE DATA', percent: 75 },
      { text: 'ACCESS GRANTED', percent: 100 },
    ];

    const stageInterval = duration / loadingStages.length;
    let currentStage = 0;

    const interval = setInterval(() => {
      if (currentStage < loadingStages.length) {
        setLoadingText(loadingStages[currentStage].text);
        setProgress(loadingStages[currentStage].percent);
        currentStage++;
      } else {
        clearInterval(interval);
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
      }
    }, stageInterval);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      >
        <source src="/images/titan-loop.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        {/* Logo/Brand */}
        <div className="text-white font-bold text-2xl tracking-tight font-sans mb-12">
          APEX<span className="text-cyan-400">_</span>INTEL
        </div>

        {/* Loading Animation */}
        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden mb-6">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading Text */}
        <div className="text-cyan-400 font-sans text-sm tracking-wider animate-pulse">
          {loadingText}
          <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />
        </div>

        {/* Percentage */}
        <div className="text-slate-500 font-sans text-xs mt-4">
          {progress}%
        </div>

        {/* Scan Lines Effect */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, cyan 2px, cyan 4px)',
            animation: 'scan 4s linear infinite',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  );
}
