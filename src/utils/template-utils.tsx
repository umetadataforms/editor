import type { FieldPathId } from '@rjsf/utils';

/**
 * Computes structural depth from a field path by ignoring array indices.
 */
function getStructuralDepth(fieldPathId: FieldPathId): number {
  return fieldPathId.path.filter((segment) => typeof segment !== 'number').length;
}

/**
 * Determines an appropriate HTML heading tag (`<h1>`–`<h4>`) and CSS class name
 * for a given field path. The heading level is inferred from the structural
 * depth so camelCase/snake_case names are preserved. We add 1 so that the root
 * depth maps to `h1` and top-level fields (depth 1) map to `h2`.
 */
function getHeadingTag(fieldPathId: FieldPathId, depthOffset = 0): {
  headingTag: string;
  headingTagClassName: string;
} {
  const structuralDepth = getStructuralDepth(fieldPathId);
  let headingLevel = structuralDepth + depthOffset + 1;
  if (headingLevel < 1) headingLevel = 1;
  // Cap the heading depth at 4.
  headingLevel = Math.min(headingLevel, 4);
  const headingTag = `h${headingLevel}`;
  const headingTagClassName = `umfe-${headingTag}`;
  return { headingTag, headingTagClassName };
}

/**
 * Returns true when the field is at the top level of the schema. Uses the
 * field path length so camelCase/snake_case names don't break detection.
 */
function isTopLevelField(fieldPathId: FieldPathId, depthOffset = 0, forceNonTopLevel = false): boolean {
  if (forceNonTopLevel) return false;
  return getStructuralDepth(fieldPathId) + depthOffset <= 1;
}

export { getHeadingTag, isTopLevelField, getStructuralDepth };
