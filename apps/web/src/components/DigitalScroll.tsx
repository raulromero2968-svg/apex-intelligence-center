import React from "react";

const DigitalScroll = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="digital-scroll-talent-tree relative p-8 my-8">
      {/* Circuit board background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,255,255,0.5)" strokeWidth="1" />
              <circle cx="0" cy="0" r="2" fill="rgba(0,255,255,0.8)" />
              <circle cx="40" cy="0" r="2" fill="rgba(0,255,255,0.8)" />
              <circle cx="0" cy="40" r="2" fill="rgba(0,255,255,0.8)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-grid)" />
        </svg>
      </div>
      
      {/* Corner connectors (like WoW talent tree nodes) */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm">
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
      </div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm">
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-sm">
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-sm">
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
      </div>
      
      {/* Connecting lines (circuit traces) */}
      <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-cyan-400/50 via-cyan-400 to-cyan-400/50" />
      <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-cyan-400/50 via-cyan-400 to-cyan-400/50" />
      <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-cyan-400/50 via-cyan-400 to-cyan-400/50" />
      <div className="absolute right-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-cyan-400/50 via-cyan-400 to-cyan-400/50" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Animated pulse effect on corners */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .digital-scroll-talent-tree::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, rgba(0,255,255,0.1), rgba(168,85,247,0.1));
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .digital-scroll-talent-tree:hover::before {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default DigitalScroll;
