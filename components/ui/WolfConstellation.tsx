'use client';

export function WolfConstellation({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={`${className} animate-pulse-slow`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Main Constellation Lines */}
      <path d="M50,10 L30,30 L40,50 L20,70 L50,90 L80,70 L60,50 L70,30 Z" className="opacity-80" />
      <path d="M30,30 L50,40 L70,30" className="opacity-80" />
      <path d="M40,50 L60,50" className="opacity-80" />
      <path d="M20,70 L40,50" className="opacity-80" />
      <path d="M80,70 L60,50" className="opacity-80" />

      {/* Stars (Nodes) */}
      <circle cx="50" cy="10" r="1.5" fill="currentColor" className="animate-ping-slow delay-100" />
      <circle cx="30" cy="30" r="1.5" fill="currentColor" className="animate-ping-slow delay-300" />
      <circle cx="70" cy="30" r="1.5" fill="currentColor" className="animate-ping-slow delay-500" />
      <circle cx="40" cy="50" r="1.5" fill="currentColor" className="animate-ping-slow delay-200" />
      <circle cx="60" cy="50" r="1.5" fill="currentColor" className="animate-ping-slow delay-400" />
      <circle cx="50" cy="40" r="1.5" fill="currentColor" className="animate-ping-slow delay-150" />
      <circle cx="20" cy="70" r="1.5" fill="currentColor" className="animate-ping-slow delay-350" />
      <circle cx="80" cy="70" r="1.5" fill="currentColor" className="animate-ping-slow delay-550" />
      <circle cx="50" cy="90" r="1.5" fill="currentColor" className="animate-ping-slow delay-250" />
    </svg>
  );
}
