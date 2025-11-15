"use client";
import StarfieldFX from "./StarfieldFX";
import MatrixRiverFX from "./MatrixRiverFX";
import ShootingSquaresFX from "./ShootingSquaresFX";

// NOTE: Our existing aurora + animated grid remain untouched and mounted as before.
export default function BackgroundStack() {
  return (
    <>
      <StarfieldFX />
      <MatrixRiverFX />
      <ShootingSquaresFX />
    </>
  );
}

