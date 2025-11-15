"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

type Sq = { id:number; s:number; x:number; y:number; d:number; delay:number; rot:number };

function useSquares(n=8) {
  let seed = 29;
  const rnd = (m:number) => { seed ^= seed<<13; seed ^= seed>>17; seed ^= seed<<5; return Math.abs(seed)%m; };
  return useMemo<Sq[]>(
    () => Array.from({ length: n }).map((_, i) => ({
      id: i,
      s: 24 + rnd(32),                 // 24–56px (bigger)
      x: rnd(100) / 100,
      y: rnd(100) / 100,
      d: 40 + rnd(30),                 // 40–70s (slower)
      delay: (i * 5) % 25,
      rot: rnd(360),
    })), []
  );
}

export default function ShootingSquaresFX() {
  const reduced = useReducedMotion();
  const squares = useSquares(9);

  if (reduced) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
      {squares.map(s => (
        <motion.div
          key={s.id}
          className="absolute rounded-md border border-cyan-400/40"
          style={{
            width: s.s, height: s.s,
            left: `${s.x * 100}%`, top: `${s.y * 100}%`,
            boxShadow: "0 0 10px rgba(34,211,238,0.25)"
          }}
          initial={{ x: "-16vw", y: "-12vh", opacity: 0, rotate: s.rot }}
          animate={{ x: "22vw", y: "18vh", opacity: [0, 0.9, 0] }}
          transition={{ duration: s.d, ease: [0.19, 1, 0.22, 1], repeat: Infinity, delay: s.delay }}
        >
          <div className="absolute inset-[-12px] rounded-md bg-cyan-400/12 blur-xl" />
        </motion.div>
      ))}
    </div>
  );
}
