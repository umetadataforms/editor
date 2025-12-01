import { JsonIO } from './jsonIO.typs';

const DEFAULT_FILE_NAME = 'metadata.json';

let lastFileHandle: any | undefined;

/**
 * Imports a JSON file selected by the user.
 */
async function importJsonFromFile(
  file: File
): Promise<any> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return data;
  } catch (err: any) {
    throw new Error('json-import-error');
  } finally {
    lastFileHandle = undefined;
  }
}

/**
 * Safely stringifies data to JSON. Throws a message on failure.
 */
function toJson(data: unknown, pretty = true): string {
  try {
    return JSON.stringify(data, pretty ? null : undefined, pretty ? 2 : 0);
  } catch {
    throw new Error('Unable to serialise data to JSON.');
  }
}

/**
 * Ensure a suggested filename has a .json extension.
 */
function ensureJsonExt(name: string): string {
  return name.toLowerCase().endsWith('.json') ? name : `${name}.json`;
}

/**
 * Returns true if the File System Access API is available and the page is
 * secure (https/localhost).
 */
function hasFSAccess(): boolean {
  return typeof (window as any).showSaveFilePicker === 'function' && isSecureContext;
}

/**
 * Trigger a browser download for a given JSON string and filename.
 */
function downloadJson(json: string, fileName: string): void {
  const ensured = ensureJsonExt(fileName);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = ensured;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Write a JSON string to a file using a previously obtained File System Access handle.
 */
async function writeWithHandle(handle: any, json: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(new Blob([json], { type: 'application/json' }));
  await writable.close();
}

/**
 * Get the file name that is being used to save the data.
 */
function getCurrentSaveFileName(fallback: string = DEFAULT_FILE_NAME): string {
  const name = (lastFileHandle && typeof lastFileHandle.name === 'string')
    ? lastFileHandle.name
    : fallback;
  return name.toLowerCase().endsWith('.json') ? name : `${name}.json`;
}

/**
 * Export the provided data as a JSON file, without any processing.
 */
function exportJson(data: unknown, fileName: string = DEFAULT_FILE_NAME): boolean {
  if (data == null) {
    throw new Error('export-json-no-data');
  }
  try {
    const json = toJson(data, true);
    downloadJson(json, fileName);
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    throw new Error('export-json-error');
  }
}

/**
 * Save the provided data to disk with a "first prompt, later silent" flow.
 *
 * Behaviour:
 * - If the **File System Access API** is supported (Chromium, secure context):
 *   - First call: prompts user to pick a destination file (suggested name used).
 *   - Subsequent calls: writes **silently** to the same file using the remembered handle.
 *   - If the previous handle becomes invalid (e.g., file moved/permissions revoked),
 *     it gracefully falls back to prompting again.
 * - If not supported (e.g., Safari/Firefox), it **falls back to a normal download** each time.
 */
async function saveJson(
  data: unknown,
  suggestedName: string = DEFAULT_FILE_NAME
): Promise<boolean> {
  if (data == null) {
    return false;
  }

  const json = toJson(data, true);

  if (hasFSAccess()) {
    if (lastFileHandle) {
      try {
        await writeWithHandle(lastFileHandle, json);
        return true;
      } catch {
        lastFileHandle = undefined;
      }
    }
    return await saveJsonAs(data, suggestedName);
  }

  downloadJson(json, suggestedName);
  return true;
}

/**
 * Save As: always prompt the user for a filename and remember the handle (if supported).
 */
async function saveJsonAs(
  data: unknown,
  suggestedName: string = DEFAULT_FILE_NAME
): Promise<boolean> {
  if (data == null) {
    return false;
  }

  const json = toJson(data, true);

  if (hasFSAccess()) {
    try {
      const ensured = ensureJsonExt(suggestedName);
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: ensured,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
        excludeAcceptAllOption: false,
      });
      await writeWithHandle(handle, json);
      lastFileHandle = handle;
      return true;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return false;
      }
      // eslint-disable-next-line no-console
      console.error(err);
      throw new Error('save-json-as-error');
    }
  }

  // Fallback for non-supporting browsers: standard download (no persistent path).
  downloadJson(json, suggestedName);
  return true;
}

/**
 * Recursively traverse data and convert selected string fields from HTML to
 * plain text. Uses a detached DOM element to parse and extract `textContent`.
 */
function transformHtmlStringsToPlainText(input: unknown): unknown {
  const stripHtmlToText = (html: string): string => {
    // Fast path
    if (!html || typeof html !== 'string') return html as unknown as string;

    // Preserve basic line breaks before parsing
    const withBreakMarkers = html
      .replace(/<(br|br\/)\s*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/(div|section|article|header|footer|aside|nav)>/gi, '\n')
      .replace(/<\/(h[1-6])>/gi, '\n')
      .replace(/<\/li>/gi, '\n');

    const div = document.createElement('div');
    div.innerHTML = withBreakMarkers;
    const text = div.textContent || '';

    return text
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      return node.map((item) => visit(item));
    }
    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (typeof v === 'string') {
          out[k] = stripHtmlToText(v);
        } else {
          out[k] = visit(v);
        }
      }
      return out;
    }
    return node;
  };

  return visit(input);
}

/**
 * Export the data to JSON after stripping all HTML tags from every string field.
 */
function exportJsonWithHtmlStripped(
  data: unknown,
  fileName: string = DEFAULT_FILE_NAME
): boolean {
  if (data == null) {
    return false;
  }
  try {
    const transformed = transformHtmlStringsToPlainText(data);
    const json = toJson(transformed, true);
    downloadJson(json, fileName);
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    throw new Error('export-json-html-error');
  }
}

export const jsonIO: JsonIO = {
  DEFAULT_FILE_NAME,
  importJsonFromFile,
  exportJson,
  saveJson,
  saveJsonAs,
  exportJsonWithHtmlStripped,
  getCurrentSaveFileName
};
