"use client";
import { usePathname } from "next/navigation";
import StarfieldFX from "./StarfieldFX";
import ShootingSquaresFX from "./ShootingSquaresFX";

// NOTE: Our existing aurora + animated grid remain untouched and mounted as before.
// MatrixRiverFX (kanji characters) removed - only MatrixRiver (katakana) remains
export default function BackgroundStack() {
  const pathname = usePathname() ?? '';

  // Hide on homepage - it has its own standalone background
  if (pathname === '/') {
    return null;
  }

  return (
    <>
      <StarfieldFX />
      <ShootingSquaresFX />
    </>
  );
}

