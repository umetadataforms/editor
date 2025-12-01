/**
 * Determines an appropriate HTML heading tag (`<h1>`–`<h4>`) and CSS class name
 * for a given field label ID. The heading level is inferred from the depth of
 * underscore-separated segments in the ID, e.g. root_label__title.
 */
function getHeadingTag(id: string): {
  headingTag: string;
  headingClassName: string;
} {
  let headingLevel = id.split("__")[0].split("_").length;
  // Cap the heading depth at 4.
  headingLevel = Math.min(headingLevel, 4);
  const headingTag = `h${headingLevel}`;
  const headingClassName = `x-${headingTag}`;
  return { headingTag, headingClassName };
}

export { getHeadingTag };
