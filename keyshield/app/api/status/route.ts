import { NextResponse } from 'next/server';
import { isOllamaAvailable } from '@/lib/ollama';

export async function GET(): Promise<NextResponse> {
  try {
    const online = await isOllamaAvailable();
    return NextResponse.json({
      ollamaOnline: online,
      model: process.env.OLLAMA_MODEL ?? 'gemma4:e4b',
      endpoint: process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434',
    });
  } catch (err: unknown) {
    console.error('[/api/status] Error:', (err as Error).message);
    return NextResponse.json({
      ollamaOnline: false,
      model: process.env.OLLAMA_MODEL ?? 'gemma4:e4b',
      error: 'Unreachable',
    });
  }
}
