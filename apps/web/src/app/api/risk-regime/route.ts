// app/api/risk-regime/route.ts
import { NextResponse } from "next/server";

// Later you'll fetch this from a real DB.
// For now it's a stub so wiring is easy to see.
export async function GET() {
  const data = {
    regime: "STABLE",        // or VOLATILE / RISK_OFF / RISK_ON etc
    score: 0.73,             // 0–1 scale
    volatilityIndex: 12.4,   // any numeric metric you like
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(data);
}
