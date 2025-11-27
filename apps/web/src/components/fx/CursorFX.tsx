"use client";
import { useEffect, useRef } from "react";

export default function CursorFX() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    el.style.transform = "translate(-9999px, -9999px)";
    let raf = 0;
    let targetX = 0, targetY = 0, x = 0, y = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX; targetY = e.clientY;
      if (!raf) tick();
    };

    const tick = () => {
      // lerp for smoothness (meditative trail)
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      el.style.transform = `translate(${x}px, ${y}px)`;
      raf = (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1)
        ? requestAnimationFrame(tick)
        : 0;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] hidden md:block"
    >
      <div className="size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.45)]" />
    </div>
  );
}

