'use client';

export const NeonSquares = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute top-20 right-40 w-32 h-32 border-2 border-cyan-500/30 rounded-lg"
        style={{ animation: 'float 20s ease-in-out infinite, rotate 15s linear infinite' }}
      />
      <div
        className="absolute bottom-40 left-20 w-24 h-24 border-2 border-magenta-500/30 rounded-lg"
        style={{ animation: 'float 25s ease-in-out infinite reverse, rotate 20s linear infinite reverse' }}
      />
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
