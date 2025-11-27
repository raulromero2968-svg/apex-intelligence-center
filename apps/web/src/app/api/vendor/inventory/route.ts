import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'maintenance' });
}

export async function POST() {
  return NextResponse.json({ status: 'maintenance' });
}

export async function PATCH() {
  return NextResponse.json({ status: 'maintenance' });
}

export async function DELETE() {
  return NextResponse.json({ status: 'maintenance' });
}
