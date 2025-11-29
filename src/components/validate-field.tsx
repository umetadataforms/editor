import type { RJSFValidationError } from '@rjsf/utils';

/**
 * Validate a single field by key against the given schema using the provided AJV validator.
 * - If key is "root" or empty, validate the whole object against the root schema.
 * - Otherwise validate the top-level property against its sub-schema, and
 *   prefix error.property with ".<key>" to keep paths consistent with RJSF.
 */
export function validateFieldOnly(
  key: string | null | undefined,
  data: any,
  schema: Record<string, any>,
  ajvValidator: any
): RJSFValidationError[] {
  if (!ajvValidator || !schema) return [];
  const whole = data ?? {};
  const isRoot = !key || key === 'root';
  const value = isRoot ? whole : whole?.[key as string];
  const fieldSchema = isRoot ? schema : (schema.properties?.[key as string] ?? {});

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
