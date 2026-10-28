import { NextRequest, NextResponse } from 'next/server';
import { getFindingById, updateFindingExplanation } from '@/lib/db';
import { explainFinding } from '@/lib/ollama';
import type { ExplainRequest, ExplainResponse } from '@/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: ExplainRequest = await req.json();

    if (!body.findingId) {
      return NextResponse.json({ error: 'findingId is required' }, { status: 400 });
    }

    const finding = getFindingById(body.findingId);
    if (!finding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    // Call Gemma 4 via Ollama
    const result = await explainFinding(finding);

    if (result.available) {
      updateFindingExplanation(finding.id, result.explanation);
    }

    return NextResponse.json({
      explanation: result.explanation,
      ollamaAvailable: result.available,
    } satisfies ExplainResponse);
  } catch (err: unknown) {
    console.error('[/api/explain] Error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
