/**
 * Returns the first paragraph line from raw markdown text.
 * Paragraphs are separated by a blank line (\n\n).
 */
export function getDescriptionFirstLine(raw: string): string {
  const firstBlock = raw.split(/\r?\n\r?\n/)[0] ?? '';
  const firstLine = firstBlock.split(/\r?\n/)[0] ?? '';
  return firstLine.trim();
}
