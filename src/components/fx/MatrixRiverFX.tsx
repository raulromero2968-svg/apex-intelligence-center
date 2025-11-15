"use client";
import { motion, useReducedMotion } from "framer-motion";

// Water and flow-related characters for river effect
const GLYPHS = "水海流波濤浪滴流川河湖池泉源湧滝瀧渓溪流波濤浪滴流川河湖池泉源湧滝瀧渓溪";

export default function MatrixRiverFX() {
  const reduced = useReducedMotion();
  // Create columns only on left and right sides
  const leftCols = 4; // 4 columns on left side
  const rightCols = 4; // 4 columns on right side
  const colWidth = 2.5; // Width in rem for each column
  const dur = (i: number) => 35 + (i % 8) * 2.5; // 35–50s (faster for water flow)

  // Left side columns (0-3)
  const leftColumns = Array.from({ length: leftCols }).map((_, i) => ({
    id: `left-${i}`,
    left: `${i * colWidth}rem`,
    delay: i * 0.6,
    duration: dur(i),
  }));

  // Right side columns (positioned from right edge)
  const rightColumns = Array.from({ length: rightCols }).map((_, i) => ({
    id: `right-${i}`,
    right: `${i * colWidth}rem`,
    delay: (i + leftCols) * 0.6,
    duration: dur(i + leftCols),
  }));

  const allColumns = [...leftColumns, ...rightColumns];

  return (
    <div aria-hidden className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
      {allColumns.map((col) => (
        <motion.div
          key={col.id}
          style={{
            [col.left !== undefined ? 'left' : 'right']: col.left || col.right,
            writingMode: "vertical-rl" as any,
          }}
          className="absolute top-[-120vh] h-[320vh] text-[16px] font-medium"
          initial={{ y: 0, opacity: 0.15 }}
          animate={
            reduced
              ? { opacity: 0.15 }
              : {
                  y: "120vh",
                  opacity: [0.12, 0.20, 0.12], // More visible for water effect
                }
          }
          transition={{
            duration: col.duration,
            ease: [0.25, 0.1, 0.25, 1] as const,
            repeat: Infinity,
            delay: col.delay,
          }}
        >
          <span
            className="select-none block"
            style={{
              color: "rgba(34,211,238,0.7)", // Brighter cyan for water
              textShadow: "0 0 8px rgba(34,211,238,0.5), 0 0 12px rgba(34,211,238,0.3)", // Enhanced glow
              letterSpacing: "0.08em",
              lineHeight: "1.8",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 5%, white 15%, white 85%, rgba(255,255,255,0.3) 95%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 5%, white 15%, white 85%, rgba(255,255,255,0.3) 95%, transparent 100%)",
            }}
          >
            {Array.from({ length: 140 })
              .map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
              .join(" ")}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

