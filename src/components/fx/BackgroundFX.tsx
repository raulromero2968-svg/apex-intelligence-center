"use client";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

type ShootingSquare = { id:number; size:number; x:number; y:number; dur:number; delay:number; rot:number; };

function useSquares(count = 6) {    // fewer stars
  let seed = 11;
  const rand = (n:number) => { seed ^= seed<<13; seed ^= seed>>17; seed ^= seed<<5; return Math.abs(seed)%n; };
  return useMemo<ShootingSquare[]>(
    () => Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: 12 + rand(28),             // 12–40px
      x: rand(100) / 100,
      y: rand(100) / 100,
      dur: 28 + rand(24),              // 28–52s (slow)
      delay: (i * 7.5) % 30,           // long stagger
      rot: rand(360),
    })), []
  );
}

export default function BackgroundFX({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const squares = useSquares(7);

  return (
    <div aria-hidden className={clsx("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      {/* Faint grid */}
      <div className="absolute inset-0 opacity-[0.18]">
        <div className="size-full bg-[linear-gradient(to_right,#22d3ee08_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee08_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Meditative matrix river: very slow horizontal shimmer lines */}
      <div className="absolute inset-0">
        {Array.from({ length: 22 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-300/22 to-transparent"
            style={{ left: `${(i * 4.5) % 100}vw`, filter: "blur(0.3px)" }}
            initial={{ x: "-6vw", opacity: 0.1 }}
            animate={
              reduced
                ? { opacity: 0.12 }
                : { x: "6vw", opacity: [0.08, 0.14, 0.08] }
            }
            transition={{
              duration: 55 + (i % 12),      // 55–66s
              ease: [0.25, 0.1, 0.25, 1],
              repeat: Infinity,
              repeatType: "mirror",
              delay: i * 0.6,
            }}
          />
        ))}
      </div>

      {/* Shooting squares = shooting stars, but chill */}
      {!reduced && (
        <div className="absolute inset-0">
          {squares.map((s) => (
            <motion.div
              key={s.id}
              className="absolute rounded-md border border-cyan-400/35 shadow-[0_0_8px_rgba(34,211,238,0.25)]"
              style={{ width: s.size, height: s.size, left: `${s.x*100}%`, top: `${s.y*100}%` }}
              initial={{ x: "-14vw", y: "-10vh", rotate: s.rot, opacity: 0 }}
              animate={{ x: "20vw", y: "16vh", opacity: [0, 0.9, 0] }}
              transition={{ duration: s.dur, ease: [0.19, 1, 0.22, 1], repeat: Infinity, delay: s.delay }}
            >
              <div className="absolute inset-[-10px] rounded-md bg-cyan-400/10 blur-lg" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
