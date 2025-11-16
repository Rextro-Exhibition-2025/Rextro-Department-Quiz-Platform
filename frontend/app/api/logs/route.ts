import { NextResponse } from 'next/server';

// Logs endpoint removed — return 410 Gone for all methods
export async function POST() {
  return new NextResponse(JSON.stringify({ success: false, message: 'Logs endpoint removed' }), { status: 410, headers: { 'Content-Type': 'application/json' } });
}

export async function GET() {
  return new NextResponse(JSON.stringify({ success: false, message: 'Logs endpoint removed' }), { status: 410, headers: { 'Content-Type': 'application/json' } });
}
