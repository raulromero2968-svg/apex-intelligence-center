"use client";
import StarfieldFX from "./StarfieldFX";
import ShootingSquaresFX from "./ShootingSquaresFX";

// NOTE: Our existing aurora + animated grid remain untouched and mounted as before.
// MatrixRiverFX (kanji characters) removed - only MatrixRiver (katakana) remains
export default function BackgroundStack() {
  return (
    <>
      <StarfieldFX />
      <ShootingSquaresFX />
    </>
  );
}


