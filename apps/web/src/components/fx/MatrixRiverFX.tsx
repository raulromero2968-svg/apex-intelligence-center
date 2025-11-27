"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Water and flow-related characters for river effect
const GLYPHS = "水海流波濤浪滴流川河湖池泉源湧滝瀧渓溪流波濤浪滴流川河湖池泉源湧滝瀧渓溪";

export default function MatrixRiverFX() {
  const reduced = useReducedMotion();
  const [isClient, setIsClient] = useState(false);
  const [glyphText, setGlyphText] = useState<string>("");

  // Generate glyph text only on client to avoid server/client mismatch
  useEffect(() => {
    setIsClient(true);
    // Generate deterministic-looking glyph sequence (still random but consistent on client)
    const text = Array.from({ length: 150 })
      .map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
      .join(" ");
    setGlyphText(text);
  }, []);

  // Create columns only on left side
  const leftCols = 4; // 4 columns on left side
  const colWidth = 2.5; // Width in rem for each column
  const dur = (i: number) => 30 + (i % 8) * 2; // 30–44s (faster for water flow)

  // Left side columns only
  const leftColumns = useMemo(() => Array.from({ length: leftCols }).map((_, i) => ({
    id: `left-${i}`,
    position: 'left' as const,
    offset: `${i * colWidth}rem`,
    delay: i * 0.5,
    duration: dur(i),
  })), [leftCols]);

  const allColumns = [...leftColumns];

  // Don't render until client-side to avoid hydration mismatch
  if (!isClient || !glyphText) {
    return null;
  }

  return (
    <div aria-hidden className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
      {allColumns.map((col) => (
        <motion.div
          key={col.id}
          style={{
            [col.position]: col.offset,
            writingMode: "vertical-rl" as any,
            width: `${colWidth}rem`,
          }}
          className="absolute top-[-120vh] h-[320vh] text-[14px] font-medium"
          initial={{ y: 0, opacity: 0.18 }}
          animate={
            reduced
              ? { opacity: 0.18 }
              : {
                  y: "120vh",
                  opacity: [0.15, 0.25, 0.15], // More visible for water effect
                }
          }
          transition={{
            duration: col.duration,
            ease: [0.2, 0, 0.3, 1] as const, // Smoother easing for water flow
            repeat: Infinity,
            delay: col.delay,
          }}
        >
          <span
            className="select-none block"
            style={{
              color: "rgba(34,211,238,0.75)", // Brighter cyan for water
              textShadow: "0 0 10px rgba(34,211,238,0.6), 0 0 15px rgba(34,211,238,0.4)", // Enhanced glow for water
              letterSpacing: "0.1em",
              lineHeight: "2.0", // More spacing for flowing effect
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 8%, white 20%, white 80%, rgba(255,255,255,0.4) 92%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 8%, white 20%, white 80%, rgba(255,255,255,0.4) 92%, transparent 100%)",
            }}
          >
            {glyphText}
          </span>
        </motion.div>
      ))}
    </div>
  );
}


