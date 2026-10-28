import { NextResponse } from 'next/server';
import { getAllFindings, getDashboardStats } from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    const findings = getAllFindings(200);
    const stats = getDashboardStats();
    return NextResponse.json({ findings, stats });
  } catch (err: unknown) {
    console.error('[/api/findings] Error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
