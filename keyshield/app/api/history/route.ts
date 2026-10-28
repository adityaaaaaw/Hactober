import { NextResponse } from 'next/server';
import { getScans } from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    const scans = getScans(50);
    return NextResponse.json({ scans });
  } catch (err: unknown) {
    console.error('[/api/history] Error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
