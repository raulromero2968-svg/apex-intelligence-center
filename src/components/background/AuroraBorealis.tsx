'use client';

export const AuroraBorealis = () => (
  <div
    className="absolute inset-0 opacity-30 will-change-transform"
    aria-hidden="true"
    style={{
      background: `
        radial-gradient(ellipse at 20% 30%, rgba(0,255,255,0.40) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 70%, rgba(0,160,255,0.30) 0%, transparent 55%),
        radial-gradient(ellipse at 50% 50%, rgba(0,200,255,0.20) 0%, transparent 75%)
      `,
      filter: 'blur(60px)',
      animation: 'aurora 15s ease-in-out infinite',
      transform: 'translateZ(0)',
    }}
  >
    <style jsx>{`
      @keyframes aurora {
        0%,100% { transform: translate3d(0, 0, 0) scale(1.02); }
        50%     { transform: translate3d(0, -10px, 0) scale(1.05); }
      }
      @media (prefers-reduced-motion: reduce) { div { animation: none !important; } }
    `}</style>
  </div>
);
