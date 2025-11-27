"use client";
import { motion, useReducedMotion } from "framer-motion";

export default function AuroraFX() {
  const reduced = useReducedMotion();

  // Gentle, slow, meditative drift. Long durations, low opacity.
  const common = {
    transition: {
      duration: 70,         // super slow
      ease: [0.42, 0, 0.58, 1] as const,
      repeat: Infinity,
      repeatType: "mirror" as const,
    },
  };

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      {/* Base space gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(85%_120%_at_50%_0%,#0d1526_0%,#08121f_60%,#06101b_100%)]" />

      {/* Cyan tide */}
      <motion.div
        {...(!reduced ? common : {})}
        className="absolute -inset-20 blur-3xl"
        style={{
          background:
            "radial-gradient(40% 60% at 20% 20%, rgba(34,211,238,0.20), transparent 60%)",
          filter: "saturate(120%)",
        }}
        initial={{ x: -60, y: -10, opacity: 0.85 }}
        animate={reduced ? { opacity: 0.85 } : { x: 60, y: 10, opacity: [0.78, 0.9, 0.78] }}
      />

      {/* Purple tide */}
      <motion.div
        {...(!reduced ? common : {})}
        className="absolute -inset-24 blur-3xl"
        style={{
          background:
            "radial-gradient(38% 58% at 85% 70%, rgba(168,85,247,0.18), transparent 60%)",
        }}
        initial={{ x: 40, y: 30, opacity: 0.8 }}
        animate={reduced ? { opacity: 0.8 } : { x: -40, y: -10, opacity: [0.72, 0.86, 0.72] }}
      />

      {/* Soft noise wash to blend banding */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-plus-lighter"
           style={{
             background:
               "repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 2px)"
           }} />
    </div>
  );
}

