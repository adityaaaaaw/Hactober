import { NextRequest, NextResponse } from 'next/server';
import { getFindingById, updateFindingStatus } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const { id } = await params;
    const findingId = parseInt(id, 10);
    if (isNaN(findingId)) {
      return NextResponse.json({ error: 'Invalid finding ID.' }, { status: 400 });
    }

    const body: { status?: string } = await req.json();
    const allowed = ['open', 'resolved', 'false_positive'];
    if (!body.status || !allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${allowed.join(', ')}` },
        { status: 400 },
      );
    }

    const updated = updateFindingStatus(findingId, body.status);
    if (!updated) {
      return NextResponse.json({ error: 'Finding not found.' }, { status: 404 });
    }

    const finding = getFindingById(findingId);
    return NextResponse.json({ finding });
  } catch (err: unknown) {
    console.error('[/api/findings/[id]] Error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
