'use client';

export const NeonSquares = () => {
  const squares = [
    { top: '10%', left: '15%', size: 'w-24 h-24', color: 'border-cyan-500/30', duration: '20s', delay: '0s' },
    { top: '60%', right: '20%', size: 'w-32 h-32', color: 'border-cyan-400/40', duration: '25s', delay: '2s' },
    { bottom: '20%', left: '10%', size: 'w-20 h-20', color: 'border-fuchsia-500/30', duration: '18s', delay: '4s' },
    { top: '40%', right: '40%', size: 'w-28 h-28', color: 'border-cyan-300/35', duration: '22s', delay: '1s' },
    { bottom: '40%', left: '30%', size: 'w-16 h-16', color: 'border-cyan-500/25', duration: '19s', delay: '3s' },
    { top: '70%', right: '60%', size: 'w-24 h-24', color: 'border-fuchsia-400/30', duration: '24s', delay: '5s' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {squares.map((square, i) => (
        <div
          key={i}
          className={`absolute ${square.size} border-2 ${square.color} rounded-lg will-change-transform`}
          style={{
            top: square.top as any,
            left: square.left as any,
            right: square.right as any,
            bottom: square.bottom as any,
            animation: `floatRotate ${square.duration} ease-in-out infinite`,
            animationDelay: square.delay as any,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes floatRotate {
          0%   { transform: translate(0, 0) rotate(0deg); }
          25%  { transform: translate(30px, -30px) rotate(90deg); }
          50%  { transform: translate(-20px, 20px) rotate(180deg); }
          75%  { transform: translate(40px, 10px) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          div { animation: none !important; }
        }
      `}</style>
    </div>
  );
};
