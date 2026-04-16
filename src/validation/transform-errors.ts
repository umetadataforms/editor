import type { RJSFValidationError } from '@rjsf/utils';
import { isTabularSchemaId, isTabularVcSchemaId } from '../utils/tabular-schema-ids';

const extractTabularLabel = (
  formData: Record<string, unknown> | undefined,
  propertyPath: string,
) => {
  const rootMatch = propertyPath.match(/root_(fields|variables)_(\d+)/);
  if (rootMatch) {
    const kind = rootMatch[1] as 'fields' | 'variables';
    const index = Number(rootMatch[2]);
    if (!Number.isFinite(index)) return null;
    const list = (formData as Record<string, unknown> | undefined)?.[kind];
    if (!Array.isArray(list)) return null;
    const label = (list[index] as Record<string, unknown> | undefined)?.label;
    return {
      kind,
      index,
      label: typeof label === 'string' && label.trim().length > 0 ? label.trim() : null,
    };
  }

  const normalized = propertyPath.replace(/^\./, '').replace(/\[(\d+)\]/g, '.$1');
  const parts = normalized.split('.').filter(Boolean);
  for (let i = 0; i < parts.length - 1; i += 1) {
    const kind = parts[i];
    const index = Number(parts[i + 1]);
    if ((kind === 'fields' || kind === 'variables') && Number.isFinite(index)) {
      const list = (formData as Record<string, unknown> | undefined)?.[kind];
      if (!Array.isArray(list)) return null;
      const label = (list[index] as Record<string, unknown> | undefined)?.label;
      return {
        kind,
        index,
        label: typeof label === 'string' && label.trim().length > 0 ? label.trim() : null,
      };
    }
  }
  return null;
};

/**
 * Formats RJSF validation errors, adding clearer messages and tabular labels.
 */
export default function transformErrors(
  errors: RJSFValidationError[],
  formData?: Record<string, unknown> | null,
  schemaId?: string,
) {
  const isTabular = typeof schemaId === 'string'
    && (isTabularSchemaId(schemaId) || isTabularVcSchemaId(schemaId));

  return errors.map(error => {
    if (error.name === 'additionalProperties') {
      const params = error.params as { additionalProperty?: string } | undefined;
      const prop = params?.additionalProperty;
      if (prop) {
        const msg = `Unexpected field "${prop}" is not allowed by the schema.`
          + ` It is not visible in the form, remove it manually outside the App.`;

        // used for inline / field-level display
        error.message = msg;

        // used by the global ErrorList (top/bottom)
        // you can include the property path if you like:
        if (error.property) {
          error.stack = `${error.property} ${msg}`;
        } else {
          error.stack = msg;
        }
      }
    }

    const propertyPath = error.property
      || (typeof error.stack === 'string' ? error.stack.split(' ')[0] : '');
    if (isTabular && propertyPath) {
      const labelInfo = extractTabularLabel(formData ?? undefined, propertyPath);
      if (labelInfo) {
        const prefix = labelInfo.label
          ? `${labelInfo.kind}[${labelInfo.index}] (${labelInfo.label})`
          : `${labelInfo.kind}[${labelInfo.index}]`;
        const message = error.message ? `${prefix}: ${error.message}` : prefix;
        error.message = message;
        error.stack = message;
      }
    }
    return error;
  });
}
