import { useEffect, useMemo, useState } from 'react';
import { Alert, Switch, Textarea } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import DOMPurify from 'dompurify';
import type { RJSFSchema, RJSFValidationError } from '@rjsf/utils';
import { validateFieldOnly } from './validate-field';

export type FieldViewerProps = {
  fieldKey: string | null;           // "author", "author.bio", or "root"
  value: unknown;                    // value at fieldKey
  schema?: RJSFSchema;               // OPTIONAL: for validation + titles
  ajvValidator?: unknown;            // OPTIONAL: from @rjsf/validator-ajv8
  rootData?: Record<string, unknown>;// OPTIONAL: full formData
};

function isHtmlString(v: unknown): v is string {
  return typeof v === 'string' && /<\/?[a-z][\s\S]*>/i.test(v as string);
}

function humaniseFallback(seg: string): string {
  const spaced = seg
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .trim();
  if (!spaced) return '';
  return spaced
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const parsePath = (path: string): string[] => {
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').filter(Boolean);
};

function resolveSchema(value: unknown): RJSFSchema | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as RJSFSchema;
}

// Traverse the schema by a dot path (root excluded). Handles object + array items.
function getSubschemaAtPath(rootSchema: RJSFSchema | undefined, path: string | null | undefined): RJSFSchema | undefined {
  if (!rootSchema) return undefined;
  if (!path || path === 'root') return rootSchema;
  const parts = parsePath(String(path));
  let node: RJSFSchema | undefined = rootSchema;

  for (const part of parts) {
    if (!node) return undefined;

    const isIndex = Number.isFinite(Number(part));
    if (isIndex && node.items) {
      node = resolveSchema(node.items);
      continue;
    }

    // Resolve "object" with properties
    if (node.properties && typeof node.properties === 'object') {
      const props = node.properties as Record<string, RJSFSchema>;
      node = props[part];
      continue;
    }

    // If wrapped with allOf/anyOf/oneOf (simple best-effort: dive into first item that has properties)
    const candidates = ([] as RJSFSchema[])
      .concat(node.allOf || [])
      .concat(node.anyOf || [])
      .concat(node.oneOf || []);
    const next = candidates.find((c) => {
      if (isIndex && c?.items) return true;
      return c?.properties && (c.properties as Record<string, RJSFSchema>)[part];
    });
    if (next) {
      if (isIndex && next.items) {
        node = resolveSchema(next.items);
      } else {
        node = (next.properties as Record<string, RJSFSchema>)[part];
      }
      continue;
    }

    return undefined;
  }

  return node;
}

function getTitleFromSchema(schema: RJSFSchema | undefined, path: string | null | undefined): string {
  if (!schema) {
    // Fallback to a humanised version of the last segment
    if (!path || path === 'root') return 'Root';
    const last = path.split('.').pop() || path;
    return humaniseFallback(last);
  }
  const subschema = getSubschemaAtPath(schema, path);
  if (subschema?.title) return subschema.title as string;

  // Fallbacks: use last segment humanised or "Root"
  if (!path || path === 'root') return schema.title || 'Root';
  const last = path.split('.').pop() || path;
  return humaniseFallback(last);
}

function stringifyValue(v: unknown): string {
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

type AjvValidator = {
  validateFormData: (
    data: unknown,
    schema: RJSFSchema
  ) => { errors?: RJSFValidationError[] };
};

function isAjvValidator(value: unknown): value is AjvValidator {
  if (!value || typeof value !== 'object') return false;
  return typeof (value as AjvValidator).validateFormData === 'function';
}

/**
 * Read-only field viewer with optional validation and HTML rendering toggle.
 */
export default function FieldViewer({
  fieldKey,
  value,
  schema,
  ajvValidator,
  rootData,
}: FieldViewerProps) {
  const [renderHtml, setRenderHtml] = useState(false);

  useEffect(() => {
    setRenderHtml(isHtmlString(value));
  }, [value]);

  const topKey = fieldKey && fieldKey !== 'root' ? fieldKey : 'root';
  const isTopObject = value && typeof value === 'object' && !Array.isArray(value);

  const topHeadingKey = `.${topKey}`;
  // const topTitle = useMemo(() => getTitleFromSchema(schema, topKey), [schema, topKey]);
  const showHtmlToggle = isHtmlString(value);

  const topErrors: RJSFValidationError[] = useMemo(() => {
    if (!schema || !isAjvValidator(ajvValidator)) return [];
    return validateFieldOnly(topKey, rootData, schema, ajvValidator);
  }, [topKey, rootData, schema, ajvValidator]);

  return (
    <div style={{ border: 'none', borderRadius: 0, padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <strong title={topHeadingKey}>{topHeadingKey}</strong>
        </div>
        <div>
          {showHtmlToggle ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Switch
                checked={renderHtml}
                onChange={(event) => setRenderHtml(event.currentTarget.checked)}
                label="Render HTML"
              />
            </span>
          ) : null}
        </div>
      </div>

      {topErrors.length > 0 ? (
        <div style={{ marginBottom: 8 }}>
          {topErrors.map((err, idx) => (
            <Alert
              key={idx}
              color="red"
              icon={<IconAlertCircle size={16} />}
            >
              {err.property ? <code>{err.property}</code> : null}
              {err.property ? <span>: </span> : null}
              {err.message}
            </Alert>
          ))}
        </div>
      ) : null}

      {isTopObject ? null : isHtmlString(value) && renderHtml ? (
        <div
          style={{
            width: '100%',
            minHeight: 40,
            border: '1px dashed var(--mantine-color-default-border)',
            borderRadius: 6,
            padding: 12,
            background: 'var(--mantine-color-body)',
            overflow: 'auto',
            wordBreak: 'break-word',
            marginBottom: 8,
          }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value as string) }}
        />
      ) : !isTopObject ? (
        <Textarea
          readOnly
          autosize
          minRows={1}
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            marginBottom: 8,
          }}
          value={stringifyValue(value)}
        />
      ) : null}

      {isTopObject ? (
        <div style={{ display: 'grid', gap: 8 }}>
          {Object.entries(value as Record<string, unknown>).map(([subKey, subVal]) => {
            const relativeKey = `.${subKey}`;                      // for display next to each sub-field
            const absolutePath = topKey === 'root' ? subKey : `${topKey}.${subKey}`;
            const headingTitle = getTitleFromSchema(schema, absolutePath);
            const looksHtml = isHtmlString(subVal);

            return (
              <div
                key={subKey}
                style={{
                  border: '1px solid var(--mantine-color-default-border)',
                  borderRadius: 6,
                  padding: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <code>{relativeKey}</code>: <strong title={`.${absolutePath}`}>{headingTitle}</strong>
                  </div>
                </div>

                {looksHtml ? (
                  <div
                    style={{
                      width: '100%',
                      minHeight: 40,
                      border: '1px dashed var(--mantine-color-default-border)',
                      borderRadius: 6,
                      padding: 10,
                      background: 'var(--mantine-color-body)',
                      overflow: 'auto',
                      wordBreak: 'break-word',
                    }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(subVal as string) }} // sanitized
                  />
                ) : (
                  <Textarea
                    readOnly
                    autosize
                    minRows={1}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                    value={stringifyValue(subVal)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
