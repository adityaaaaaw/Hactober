import type { Finding } from '@/types';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL ?? 'gemma4:e4b';
const TIMEOUT_MS = 60_000;

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream: boolean;
  thinking?: boolean;
  options?: {
    temperature: number;
    num_predict: number;
  };
}

interface OllamaChatResponse {
  message: { content: string; thinking?: string };
  done: boolean;
}

/**
 * Asks Gemma 4 via Ollama to explain a finding and suggest safe remediation.
 *
 * Security guarantees:
 *  - Raw secret values are NEVER sent to the model; only masked signatures and metadata are included.
 *  - Only sanitized context is passed.
 *  - Handles Ollama connection errors and timeouts gracefully.
 */
export async function explainFinding(finding: Finding): Promise<{ explanation: string; available: boolean }> {
  const prompt = buildPrompt(finding);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are KeyShield AI, an elite cybersecurity and developer security assistant powered by Gemma 4. ' +
              'Explain secret exposure risks clearly, concisely, and practically. ' +
              'Format responses in 3 clean markdown sections: 1) Risk & Impact, 2) Step-by-Step Remediation, and 3) Prevention. ' +
              'Never request or generate real production credentials.',
          },
          { role: 'user', content: prompt },
        ],
        stream: false,
        thinking: false,
        options: { temperature: 0.2, num_predict: 1200 },
      } satisfies OllamaChatRequest),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama server returned status ${response.status}`);
    }

    const data: OllamaChatResponse = await response.json();
    const rawContent = data.message?.content?.trim() || data.message?.thinking?.trim() || '';

    return { explanation: rawContent, available: true };
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const isNetworkError =
      err instanceof Error &&
      (err.message.includes('ECONNREFUSED') ||
        err.message.includes('fetch failed') ||
        err.message.includes('NetworkError') ||
        isAbort);

    if (isNetworkError || isAbort) {
      return {
        explanation:
          '**Ollama is offline or unreachable.** Ensure Ollama is running (`ollama serve`) with model `gemma4:e4b` available.\n\n' +
          `**Rule-Based Remediation:** ${finding.remediation}`,
        available: false,
      };
    }

    console.error('[KeyShield Gemma4] Ollama error:', (err as Error).message);
    return {
      explanation:
        `An error occurred while communicating with Gemma 4: ${(err as Error).message}\n\n` +
        `**Remediation:** ${finding.remediation}`,
      available: false,
    };
  }
}

/**
 * Checks if Ollama and the specified Gemma 4 model are reachable.
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Build a safe prompt for Gemma 4.
 * PRIVACY GUARANTEE: Only masked signatures (e.g. AKIA••••••••••••MPLE)
 * and sanitized lines are included. Raw values are strictly withheld.
 */
function buildPrompt(finding: Finding): string {
  return `A candidate secret leak was detected in source code.

**Finding Metadata:**
- Secret Classification: ${finding.ruleName} (${finding.ruleId})
- Severity Level: ${finding.severity.toUpperCase()}
- Location: ${finding.filePath} (line ${finding.lineNumber})
- Masked Secret Signature: \`${finding.maskedValue}\`
- Sanitized Code Line: \`${finding.lineContent}\`

Please provide:
1. **Risk & Impact:** What risk does exposing this secret category present to the organization?
2. **Remediation Steps:** What immediate steps should the developer take to rotate and revoke this key safely?
3. **Future Prevention:** How should this secret be properly managed (e.g., environment variables, secrets vault)?

Keep your response practical, concise, and developer-friendly.`;
}
