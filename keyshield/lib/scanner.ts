import type { RawFinding } from '@/types';
import { SECRET_RULES } from '@/lib/rules';
import { maskSecret, maskLineContent } from '@/lib/masker';

interface ScanFile {
  name: string;
  content: string;
}

/**
 * Scans one or more files/code snippets for secrets using deterministic regex rules.
 *
 * Security guarantees:
 *  - Source content is NEVER executed — only passed through RegExp.exec()
 *  - Raw secret values are only stored in RawFinding.rawValue (never logged)
 *  - File content is treated as untrusted string data
 */
export function scanFiles(files: ScanFile[]): RawFinding[] {
  const findings: RawFinding[] = [];

  for (const file of files) {
    // Sanitise filename: strip any path traversal
    const safeName = sanitiseFilePath(file.name);
    const lines = file.content.split('\n');

    for (const rule of SECRET_RULES) {
      // Reset lastIndex so re-using global regex across files works correctly
      rule.pattern.lastIndex = 0;

      let match: RegExpExecArray | null;

      // Temporarily work on the full content to get positions, then map to lines
      const fullContent = file.content;
      rule.pattern.lastIndex = 0;

      while ((match = rule.pattern.exec(fullContent)) !== null) {
        // For regex rules, extract the exact matched secret value:
        // If capture group 1 exists and isn't a small prefix like 'live' or 'test', use it.
        // Otherwise use the full match.
        let rawValue = match[0];
        if (match[1] && match[1].length > 6) {
          rawValue = match[1];
        }

        if (!isLikelySecret(rawValue, rule.id)) continue;

        // Find which line this match is on
        const beforeMatch = fullContent.slice(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const lineContent = lines[lineNumber - 1] ?? '';

        findings.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          rawValue,
          maskedValue: maskSecret(rawValue),
          lineNumber,
          lineContent: maskLineContent(lineContent, rawValue),
          filePath: safeName,
          remediation: rule.remediation,
        });

        // Avoid infinite loops on zero-length matches
        if (match.index === rule.pattern.lastIndex) {
          rule.pattern.lastIndex++;
        }
      }

      // Always reset after use
      rule.pattern.lastIndex = 0;
    }
  }

  return deduplicateFindings(findings);
}

/** Best-effort heuristics to reduce false positives */
function isLikelySecret(value: string, ruleId: string): boolean {
  // Ignore placeholder / example values
  const fakePhrases = [
    'your-api-key',
    'your_api_key',
    'YOUR_API_KEY',
    'insert-key-here',
    'xxxxxxxxxx',
    '1234567890',
    'abcdefghij',
    'dummy-secret',
    'changeme',
    'replace_me',
    '<YOUR',
    '[YOUR',
  ];
  const lower = value.toLowerCase();
  if (fakePhrases.some((p) => lower.includes(p.toLowerCase()))) return false;

  // PEM headers are always real
  if (value.startsWith('-----BEGIN')) return true;

  // Skip very short values for generic rules
  if (['generic-password', 'generic-api-key', 'jwt-secret'].includes(ruleId)) {
    if (value.length < 8) return false;
  }

  return true;
}

/** Remove exact duplicates (same rule + same file + same line) */
function deduplicateFindings(findings: RawFinding[]): RawFinding[] {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.ruleId}::${f.filePath}::${f.lineNumber}::${f.maskedValue}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Strip path traversal attempts from file names */
function sanitiseFilePath(name: string): string {
  return name
    .replace(/\\/g, '/')
    .split('/')
    .filter((seg) => seg !== '..' && seg !== '.')
    .join('/')
    .slice(0, 256); // cap length
}
