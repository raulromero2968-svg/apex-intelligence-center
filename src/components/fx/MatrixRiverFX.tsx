"use client";
import { motion, useReducedMotion } from "framer-motion";

const GLYPHS = "ｱｶｻﾀﾅﾊﾏﾔﾗﾜｶﾞｻﾞﾀﾞﾊﾞﾊﾟﾏﾞﾖﾞﾗﾞﾜﾞ日月火水木金土光影空海雲星龍狼";

export default function MatrixRiverFX() {
  const reduced = useReducedMotion();
  const cols = 18; // gentle density

  // long, slow, meditative; streams loop
  const dur = (i:number) => 40 + (i % 10) * 3; // 40–67s

  return (
    <div aria-hidden className="fixed inset-0 -z-20 pointer-events-none">
      {Array.from({ length: cols }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            left: `${(i + 0.5) * (100 / cols)}vw`,
            writingMode: "vertical-rl" as any,
          }}
          className="absolute top-[-120vh] h-[320vh] w-[1.2rem] text-[14px] font-medium"
          initial={{ y: 0, opacity: 0.12 }}
          animate={
            reduced ? { opacity: 0.12 } : { y: "120vh", opacity: [0.10, 0.16, 0.10] }
          }
          transition={{
            duration: dur(i),
            ease: [0.25, 0.1, 0.25, 1],
            repeat: Infinity,
            delay: i * 0.8
          }}
        >
          <span
            className="select-none"
            style={{
              color: "rgba(34,211,238,0.6)",           // cyan
              textShadow: "0 0 6px rgba(34,211,238,0.35)",
              letterSpacing: "0.05em",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, white 12%, white 88%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, white 12%, white 88%, transparent 100%)",
            }}
          >
            {Array.from({ length: 120 })
              .map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
              .join(" ")}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
