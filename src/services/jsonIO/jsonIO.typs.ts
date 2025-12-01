export type SaveFileStatus = 'ready' | 'saved' | 'modified';

/**
 * Contract for the JSON I/O surface area. Any implementation (browser, Node,
 * tests, etc.) can provide these methods with identical behaviour/signatures.
 */
export interface JsonIO {
  /** Default filename used when none is provided. */
  readonly DEFAULT_FILE_NAME: string;

  /** Import a JSON file chosen by the user. */
  importJsonFromFile(file: File): Promise<boolean>;

  /** Always prompt for a destination (and remember the handle if supported). */
  saveJsonAs(data: unknown, suggestedName?: string): Promise<boolean>;

  /** Save JSON, remembering a file handle if supported. */
  saveJson(data: unknown, suggestedName?: string): Promise<boolean>;

  /** Export JSON as-is via download (or platform-appropriate mechanism). */
  exportJson(data: unknown, fileName?: string): boolean;

  /** Export JSON after stripping all HTML from string fields. */
  exportJsonWithHtmlStripped(data: unknown, fileName?: string): boolean;

  /** Return the current “save” filename (if a handle is remembered), or a fallback. */
  getCurrentSaveFileName(fallback?: string): string;
}
