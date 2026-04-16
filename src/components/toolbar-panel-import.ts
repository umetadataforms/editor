import { useCallback } from 'react';

import { notifications } from '@mantine/notifications';

import type { SchemaKey } from '../registries/schema-registry';
import SCHEMAREG from '../registries/schema-registry';

type FormData = Record<string, unknown>;

/**
 * Validates imported JSON and selects the matching schema.
 */
export async function importJsonWithSchema(
  data: FormData,
  selectSchemaImmediate: (key: SchemaKey, data: FormData) => Promise<void>
) {
  const payload = data as { schema?: unknown; $schema?: unknown };
  const rawSchemaKey = payload.schema || payload.$schema;

  if (!rawSchemaKey || typeof rawSchemaKey !== 'string') {
    notifications.show({ color: 'red', message: 'Imported JSON is missing a valid "schema" key.' });
    throw new Error('handle-import-json-no-schema-key');
  }

  if (!(rawSchemaKey in SCHEMAREG)) {
    notifications.show({
      color: 'red',
      message: `Unknown schema "${rawSchemaKey}" in imported JSON. Data not loaded.`,
    });
    throw new Error('handle-import-json-unknown-schema-key');
  }

  const schemaKey = rawSchemaKey as SchemaKey;

  await selectSchemaImmediate(schemaKey, data);
}

/**
 * Wraps schema-aware JSON imports for the toolbar.
 */
export function useImportJsonHandler(
  selectSchemaImmediate: (key: SchemaKey, data: FormData) => Promise<void>
) {
  return useCallback(
    (data: FormData) => importJsonWithSchema(data, selectSchemaImmediate),
    [selectSchemaImmediate]
  );
}
