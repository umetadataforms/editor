const ROOT_PREFIX = 'root_';
const RJSF_ID_SUFFIX = '__';

type PathPart = string | number;

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  !!value && typeof value === 'object' && !Array.isArray(value)
);

const shouldUnsetValue = (value: unknown): boolean => (
  value === undefined || value === null || value === ''
);

function idToPath(id: string | undefined): PathPart[] {
  if (!id || id === 'root') return [];

  const suffixIndex = id.indexOf(RJSF_ID_SUFFIX);
  const withoutSuffix = suffixIndex >= 0 ? id.slice(0, suffixIndex) : id;
  const normalized = withoutSuffix.startsWith(ROOT_PREFIX)
    ? withoutSuffix.slice(ROOT_PREFIX.length)
    : withoutSuffix;
  if (!normalized) return [];

  return normalized
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

function unsetAtPath(data: unknown, path: PathPart[]): unknown {
  if (path.length === 0) return data;

  const [head, ...tail] = path;

  if (Array.isArray(data)) {
    if (typeof head !== 'number' || head < 0 || head >= data.length) return data;
    if (tail.length === 0) return data;
    const current = data[head];
    const nextChild = unsetAtPath(current, tail);
    if (nextChild === current) return data;
    const next = data.slice();
    next[head] = nextChild;
    return next;
  }

  if (!isPlainObject(data)) {
    return data;
  }

  const key = String(head);
  if (!Object.hasOwn(data, key)) return data;

  if (tail.length === 0) {
    if (!shouldUnsetValue(data[key])) return data;
    const next = { ...data };
    delete next[key];
    return next;
  }

  const current = data[key];
  const nextChild = unsetAtPath(current, tail);
  if (nextChild === current) return data;
  return { ...data, [key]: nextChild };
}

/**
 * Unsets the field referenced by an RJSF change id when its value is empty.
 */
export default function unsetEmptyById<T>(data: T, changedId?: string): T {
  const path = idToPath(changedId);
  if (path.length === 0) return data;
  return unsetAtPath(data, path) as T;
}
