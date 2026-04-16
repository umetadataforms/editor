import type { RJSFSchema, RJSFValidationError } from '@rjsf/utils';

const parsePath = (path: string): string[] => {
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').filter(Boolean);
};

const getValueAtPath = (data: unknown, path: string[]): unknown => {
  let node: unknown = data;
  for (const part of path) {
    if (node == null) return undefined;
    if (Array.isArray(node)) {
      const idx = Number(part);
      if (!Number.isFinite(idx)) return undefined;
      node = node[idx];
      continue;
    }
    if (typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
};

const resolveSchema = (value: unknown): RJSFSchema | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as RJSFSchema;
};

const getSchemaAtPath = (rootSchema: RJSFSchema, path: string[]): RJSFSchema => {
  let node: RJSFSchema | undefined = rootSchema;
  for (const part of path) {
    if (!node) return {};
    const isIndex = Number.isFinite(Number(part));
    if (isIndex && node.items) {
      node = resolveSchema(node.items);
      continue;
    }
    if (node.properties && typeof node.properties === 'object') {
      node = (node.properties as Record<string, RJSFSchema>)[part] ?? {};
      continue;
    }
    const candidates = ([] as Array<RJSFSchema | boolean>)
      .concat(node.allOf || [])
      .concat(node.anyOf || [])
      .concat(node.oneOf || []);
    const next = candidates.find((c) => {
      if (!c || typeof c !== 'object') return false;
      if (isIndex && (c as RJSFSchema).items) return true;
      return (c as RJSFSchema).properties && (c as RJSFSchema).properties?.[part];
    });
    if (next) {
      const nextSchema = next as RJSFSchema;
      node = isIndex && nextSchema.items
        ? resolveSchema(nextSchema.items)
        : (nextSchema.properties as Record<string, RJSFSchema> | undefined)?.[part] ?? {};
      continue;
    }
    return {};
  }
  return node ?? {};
};

/**
 * Validate a single field by key against the given schema using the provided AJV validator.
 * - If key is "root" or empty, validate the whole object against the root schema.
 * - Otherwise validate the top-level property against its sub-schema, and
 *   prefix error.property with ".<key>" to keep paths consistent with RJSF.
 */
export function validateFieldOnly(
  key: string | null | undefined,
  data: unknown,
  schema: RJSFSchema,
  ajvValidator: { validateFormData: (data: unknown, schema: RJSFSchema) => { errors?: RJSFValidationError[] } } | null
): RJSFValidationError[] {
  if (!ajvValidator || !schema) return [];
  const whole = data ?? {};
  const isRoot = !key || key === 'root';
  const pathParts = !isRoot ? parsePath(String(key)) : [];
  const value = isRoot ? whole : getValueAtPath(whole, pathParts);
  const fieldSchema = isRoot ? schema : getSchemaAtPath(schema, pathParts);

  const res = ajvValidator.validateFormData(value, fieldSchema);
  const errs = (res?.errors ?? []) as RJSFValidationError[];

  if (isRoot) return errs;

  const prefixed = errs.map((e) => {
    const prop = e.property || '';
    const prefix = `.${key}`;
    const property = prop.startsWith('.')
      ? `${prefix}${prop}`
      : `${prefix}${prop ? `.${prop}` : ''}`;
    // return { ...e, property };
    return { ...e, property, stack: e.stack?.replace(e.property ?? '', property) };
  });

  return prefixed;
}
