import { NextRequest, NextResponse } from 'next/server';
import { scanFiles } from '@/lib/scanner';
import {
  insertScan,
  insertFinding,
  updateScanCounts,
  getFindingsByScan,
  getScanById,
  updateFindingExplanation,
} from '@/lib/db';
import { explainFinding } from '@/lib/ollama';
import type { ScanRequest, ScanResponse } from '@/types';

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB per file
const MAX_FILES = 20;
const MAX_PASTE_SIZE = 500 * 1024; // 500 KB

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: ScanRequest = await req.json();

    const files: Array<{ name: string; content: string }> = [];

    // ── Validate uploaded files ──────────────────────────────────────────
    if (body.files && body.files.length > 0) {
      if (body.files.length > MAX_FILES) {
        return NextResponse.json(
          { error: `Too many files. Maximum is ${MAX_FILES}.` },
          { status: 400 },
        );
      }

      for (const f of body.files) {
        if (!f.name || typeof f.content !== 'string') continue;
        if (f.content.length > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File "${f.name}" exceeds the 1 MB limit.` },
            { status: 400 },
          );
        }
        files.push({ name: f.name, content: f.content });
      }
    }

    // ── Validate pasted code ─────────────────────────────────────────────
    if (body.pastedCode) {
      if (body.pastedCode.length > MAX_PASTE_SIZE) {
        return NextResponse.json(
          { error: 'Pasted code exceeds the 500 KB limit.' },
          { status: 400 },
        );
      }
      files.push({ name: 'pasted-code.txt', content: body.pastedCode });
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No content provided. Upload files or paste code.' },
        { status: 400 },
      );
    }

    // ── Determine scan metadata ──────────────────────────────────────────
    const scanName =
      body.scanName?.slice(0, 120) ||
      (body.files && body.files.length > 0
        ? `Upload — ${body.files.map((f) => f.name).join(', ').slice(0, 80)}`
        : `Paste scan — ${new Date().toISOString().slice(0, 16)}`);
    const source = body.files && body.files.length > 0 ? 'upload' : 'paste';

    // ── Run scanner (pure regex AST — no code execution) ─────────────────
    const rawFindings = scanFiles(files);

    // ── Persist scan to SQLite ───────────────────────────────────────────
    const scanId = insertScan(scanName, source, files.length);

    const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    const savedFindingIds: number[] = [];

    for (const rf of rawFindings) {
      const fid = insertFinding({
        scanId,
        ruleId: rf.ruleId,
        ruleName: rf.ruleName,
        severity: rf.severity,
        maskedValue: rf.maskedValue,
        lineNumber: rf.lineNumber,
        lineContent: rf.lineContent,
        filePath: rf.filePath,
        remediation: rf.remediation,
      });
      savedFindingIds.push(fid);

      counts.total++;
      if (rf.severity === 'critical') counts.critical++;
      else if (rf.severity === 'high') counts.high++;
      else if (rf.severity === 'medium') counts.medium++;
      else counts.low++;
    }

    updateScanCounts(scanId, counts);

    // ── Automated Gemma 4 Integration on Scan Completion ─────────────────
    // If findings were detected, immediately ask Gemma 4 for an AI risk explanation
    // on the most critical / primary finding so it appears immediately in the UI.
    const findings = getFindingsByScan(scanId);

    if (findings.length > 0) {
      const primaryFinding = findings[0];
      try {
        const aiResult = await explainFinding(primaryFinding);
        if (aiResult.available && aiResult.explanation) {
          updateFindingExplanation(primaryFinding.id, aiResult.explanation);
          primaryFinding.aiExplanation = aiResult.explanation;
        }
      } catch (aiErr) {
        console.warn('[Scan] Gemma 4 post-scan explanation skipped:', (aiErr as Error).message);
      }
    }

    const scan = getScanById(scanId)!;

    return NextResponse.json({ scan, findings } satisfies ScanResponse, {
      status: 201,
    });
  } catch (err: unknown) {
    console.error('[/api/scan] Error:', (err as Error).message);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
