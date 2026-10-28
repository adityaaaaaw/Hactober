/**
 * Secret masker — shows only enough characters to identify the secret type
 * without revealing the full value.
 *
 * Security note: the raw value MUST NOT be logged or sent to AI prompts.
 */

/** Characters of prefix to show for identification */
const PREFIX_CHARS = 4;
/** Characters of suffix to show for continuity */
const SUFFIX_CHARS = 4;
const MASK_CHAR = '•';

export function maskSecret(raw: string): string {
  if (!raw || raw.length === 0) return '****';

  // For PEM headers — already a harmless string, return as-is
  if (raw.startsWith('-----BEGIN')) return raw.trim();

  const len = raw.length;

  if (len <= 8) {
    // Mask everything for very short secrets
    return MASK_CHAR.repeat(len);
  }

  const prefix = raw.slice(0, PREFIX_CHARS);
  const suffix = raw.slice(-SUFFIX_CHARS);
  const middleLen = Math.min(len - PREFIX_CHARS - SUFFIX_CHARS, 12);

  return `${prefix}${MASK_CHAR.repeat(middleLen)}${suffix}`;
}

/**
 * Mask a secret value within a line of code for display.
 * Replaces the raw secret with its masked version inline.
 */
export function maskLineContent(line: string, rawSecret: string): string {
  if (!rawSecret || rawSecret.startsWith('-----BEGIN')) {
    // For PEM markers just return the line, no inline value to mask
    return line.length > 200 ? line.slice(0, 200) + '…' : line;
  }

  const masked = maskSecret(rawSecret);
  const replaced = line.replaceAll(rawSecret, masked);
  return replaced.length > 200 ? replaced.slice(0, 200) + '…' : replaced;
}
