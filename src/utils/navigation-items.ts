import type { RJSFSchema } from '@rjsf/utils';

type NavigationItem = { key: string; title: string };

const isObjectDef = (def: unknown): def is Record<string, unknown> =>
  !!def && typeof def === 'object' && !Array.isArray(def);

/**
 * Builds navigation items from the top-level schema properties.
 * Includes a root "Top" entry and skips false property definitions.
 */
export function schemaToNavigationItems(schema: RJSFSchema): NavigationItem[] {
  const entries = Object.entries(schema.properties ?? {}).filter(
    ([, def]) => def !== false,
  );
  return [
    { key: 'root', title: 'Top' },
    ...entries.map(([key, def]) => {
      const defRecord = def as Record<string, unknown> | undefined;
      const title =
        isObjectDef(def) && typeof defRecord?.title === 'string'
          ? defRecord.title
          : key;
      return { key, title };
    }),
  ];
}
