import { useEffect, useMemo, useState } from 'react';
import { Input, Switch, Alert } from 'antd';
import DOMPurify from 'dompurify';
import type { RJSFValidationError } from '@rjsf/utils';
import { validateFieldOnly } from './validate-field';

const { TextArea } = Input;

export type FieldViewerProps = {
  fieldKey: string | null;           // "author", "author.bio", or "root"
  value: unknown;                    // value at fieldKey
  schema?: Record<string, any>;      // OPTIONAL: for validation + titles
  ajvValidator?: any;                // OPTIONAL: from @rjsf/validator-ajv8
  rootData?: any;                    // OPTIONAL: full formData
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

/** Traverse the schema by a dot path (root excluded). Only handles object/props paths. */
function getSubschemaAtPath(rootSchema: any, path: string | null | undefined): any | undefined {
  if (!rootSchema) return undefined;
  if (!path || path === 'root') return rootSchema;
  const parts = String(path).split('.');
  let node: any = rootSchema;

  for (const part of parts) {
    if (!node) return undefined;

    // Resolve "object" with properties
    if (node.properties && typeof node.properties === 'object') {
      node = node.properties[part];
      continue;
    }

    // If wrapped with allOf/anyOf/oneOf (simple best-effort: dive into first item that has properties)
    const candidates = ([] as any[])
      .concat(node.allOf || [])
      .concat(node.anyOf || [])
      .concat(node.oneOf || []);
    const next = candidates.find((c) => c?.properties && c.properties[part]);
    if (next) {
      node = next.properties[part];
      continue;
    }

    return undefined;
  }

  return node;
}

function getTitleFromSchema(
  schema: Record<string, any> | undefined,
  path: string | null | undefined
): string {
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
  const topTitle = useMemo(() =>
    getTitleFromSchema(schema as any, topKey),
    [schema, topKey]
  );
  const showHtmlToggle = isHtmlString(value);

  const topErrors: RJSFValidationError[] = useMemo(() => {
    if (!schema || !ajvValidator) return [];
    return validateFieldOnly(topKey, rootData, schema, ajvValidator);
  }, [topKey, rootData, schema, ajvValidator]);

  return (
    <div style={{ border: 'none', borderRadius: 0, padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <strong title={topHeadingKey}>{topTitle}</strong>
        </div>
        <div>
          {showHtmlToggle ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Switch checked={renderHtml} onChange={setRenderHtml} />
              <span>Render HTML</span>
            </span>
          ) : null}
        </div>
      </div>

      {topErrors.length > 0 ? (
        <div style={{ marginBottom: 8 }}>
          {topErrors.map((err, idx) => (
            <Alert
              key={idx}
              type="error"
              showIcon
              message={
                <span>
                  {err.property ? <code>{err.property}</code> : null}
                  {err.property ? <span>: </span> : null}
                  {err.message}
                </span>
              }
            />
          ))}
        </div>
      ) : null}

      {isTopObject ? null : isHtmlString(value) && renderHtml ? (
        <div
          style={{
            width: '100%',
            minHeight: 40,
            border: '1px dashed var(--ant-color-border, #eaeaea)',
            borderRadius: 6,
            padding: 12,
            background: 'var(--ant-color-bg-container, #fff)',
            overflow: 'auto',
            wordBreak: 'break-word',
            marginBottom: 8,
          }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value as string) }}
        />
      ) : !isTopObject ? (
        <TextArea
          readOnly
          autoSize={{ minRows: 0 }}
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
            const headingTitle = getTitleFromSchema(schema as any, absolutePath);
            const looksHtml = isHtmlString(subVal);

            return (
              <div
                key={subKey}
                style={{
                  border: '1px solid var(--ant-color-border-secondary, #f5f5f5)',
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
                      border: '1px dashed var(--ant-color-border, #eaeaea)',
                      borderRadius: 6,
                      padding: 10,
                      background: 'var(--ant-color-bg-container, #fff)',
                      overflow: 'auto',
                      wordBreak: 'break-word',
                    }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(subVal as string) }} // sanitized
                  />
                ) : (
                  <TextArea
                    readOnly
                    autoSize={{ minRows: 0 }}
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
