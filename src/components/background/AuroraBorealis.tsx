'use client';

export const AuroraBorealis = () => {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 20% 30%, rgba(138, 43, 226, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(0, 255, 255, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(255, 0, 255, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'aurora 15s ease-in-out infinite'
        }}
      />
      <style jsx>{`
        @keyframes aurora {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};
