import type { RJSFSchema } from "@rjsf/utils";

/**
 * Checks whether a JSON Schema (RJSFSchema) allows `null` values.
 *
 * Supported cases:
 * - `"type": "null"`
 * - `"type": ["string", "null"]` (or any other valid type combined with `"null"`)
 * - `enum` arrays that explicitly include the JSON literal `null`
 * - `oneOf` / `anyOf` subschemas that allow `null` by type or enum
 *
 * Notes:
 * - The string `"null"` in an enum is treated as a string value, not literal `null`.
 * - Returns `true` if any of the above conditions are met, otherwise `false`.
 */
function schemaAllowsNull(schema: RJSFSchema): boolean {
  const s = schema as any;

  const hasNull = (t: string | string[] | undefined): boolean =>
    t === "null" || (Array.isArray(t) && t.includes("null"));

  const enumAllowsNull = (e: unknown): boolean =>
    Array.isArray(e) && e.includes(null);

  const altNullable = (arr?: RJSFSchema[]): boolean =>
    Array.isArray(arr) &&
    arr.some(def => hasNull(def?.type) || enumAllowsNull(def?.enum));

  const nullable = hasNull(s.type);
  const enumNullable = enumAllowsNull(s.enum);
  const oneOfNullable = altNullable(s.oneOf);
  const anyOfNullable = altNullable(s.anyOf);

  return nullable || enumNullable || oneOfNullable || anyOfNullable;
}

export { schemaAllowsNull };
