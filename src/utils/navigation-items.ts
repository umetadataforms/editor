import type { RJSFSchema } from '@rjsf/utils';

type NavigationItem = { key: string; title: string };

const isObjectDef = (def: unknown): def is Record<string, unknown> =>
  !!def && typeof def === 'object' && !Array.isArray(def);

export function schemaToNavigationItems(schema: RJSFSchema): NavigationItem[] {
  const entries = Object.entries(schema.properties ?? {}).filter(
    ([, def]) => def !== false,
  );
  return [
    { key: 'root', title: 'Top' },
    ...entries.map(([key, def]) => {
      const title =
        isObjectDef(def) && typeof (def as any).title === 'string'
          ? (def as any).title
          : key;
      return { key, title };
    }),
  ];
}
