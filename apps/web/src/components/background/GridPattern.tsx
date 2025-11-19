'use client';

export const GridPattern = () => (
  <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,255,255,0.3)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);
