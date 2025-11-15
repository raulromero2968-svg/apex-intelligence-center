"use client";
import StarfieldFX from "./StarfieldFX";
import MatrixRiverFX from "./MatrixRiverFX";
import ShootingSquaresFX from "./ShootingSquaresFX";
// NOTE: Your Aurora + Grid are already in the project; we leave them as-is.

export default function BackgroundStack() {
  return (
    <>
      {/* furthest back */}
      <StarfieldFX />
      {/* Your Aurora component stays wherever you already mount it */}
      {/* Your animated grid stays untouched */}
      {/* foreground ambient layers */}
      <MatrixRiverFX />
      <ShootingSquaresFX />
    </>
  );
}
