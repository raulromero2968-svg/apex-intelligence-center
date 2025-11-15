"use client";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

type ShootingSquare = {
  id: number;
  size: number;
  startX: number;
  startY: number;
  duration: number;
  delay: number;
  rotate: number;
};

function useSquares(count = 12, seed = 7) {
  // lightweight PRNG for stable server/client match
  const rand = (n: number) => {
    seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
    return Math.abs(seed) % n;
  };
  return useMemo<ShootingSquare[]>(() =>
    Array.from({ length: count }).map((_, i) => {
      const size = 10 + rand(25); // 10–35px
      return {
        id: i,
        size,
        startX: rand(100) / 100,      // 0–1 viewport width
        startY: rand(100) / 100,      // 0–1 viewport height
        duration: 8 + rand(10) / 2,   // 8–13s
        delay: (i * 0.6) % 5,         // staggered
        rotate: rand(360),
      };
    }), []
  );
}

export default function BackgroundFX({
  className,
}: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const squares = useSquares(16);

  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(80%_120%_at_50%_0%,#141a2a_0%,#0a1220_100%)]",
        className
      )}
    >
      {/* Grid + faint stars base */}
      <div className="absolute inset-0 opacity-[0.25]">
        <div className="size-full bg-[linear-gradient(to_right,#22d3ee08_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee08_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Meditative matrix river: slow horizontal glyph streams */}
      <div className="absolute inset-0">
        <div className="relative size-full">
          {Array.from({ length: 28 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"
              style={{
                left: `${(i * 3.8) % 100}vw`,
                filter: "blur(0.2px)",
              }}
              initial={{ x: "-10vw", opacity: 0.0 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0.12 }
                  : {
                      x: "10vw",
                      opacity: [0.08, 0.16, 0.08],
                    }
              }
              transition={{
                duration: 20 + (i % 10),     // 20–29s slow drift
                ease: [0.25, 0.1, 0.25, 1],  // ease-in-out (calm)
                repeat: Infinity,
                repeatType: "mirror",
                delay: i * 0.35,
              }}
            />
          ))}
        </div>
      </div>

      {/* Shooting neon squares (diagonal like shooting stars) */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0">
          {squares.map((sq) => (
            <motion.div
              key={sq.id}
              className="absolute rounded-md border border-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.35)]"
              style={{
                width: sq.size,
                height: sq.size,
                left: `${sq.startX * 100}%`,
                top: `${sq.startY * 100}%`,
              }}
              initial={{
                x: "-20vw",
                y: "-15vh",
                rotate: sq.rotate,
                opacity: 0,
              }}
              animate={{
                x: "30vw",
                y: "25vh",
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: sq.duration,
                ease: [0.16, 1, 0.3, 1], // playful snap
                repeat: Infinity,
                delay: sq.delay,
              }}
            >
              {/* trailing glow */}
              <div className="absolute inset-[-8px] rounded-md bg-cyan-400/10 blur-md" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
