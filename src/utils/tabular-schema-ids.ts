import type { SchemaKey } from '../registries/schema-registry';

export const TABULAR_SCHEMA_KEY: SchemaKey =
  'https://github.com/umetadataforms/schemas/raw/main/modular/tabular-data-metadata/v0.0.2.json';
export const TABULAR_SCHEMA_STANDALONE_ID =
  'https://github.com/umetadataforms/schemas/raw/main/standalone/tabular-data-metadata/v0.0.2.json';
export const TABULAR_VC_SCHEMA_KEY: SchemaKey = 'tabular-data-metadata-schema.json';

export const isTabularSchemaId = (schemaId?: string) => schemaId === TABULAR_SCHEMA_KEY
  || schemaId === TABULAR_SCHEMA_STANDALONE_ID;
export const isTabularVcSchemaId = (schemaId?: string) => schemaId === TABULAR_VC_SCHEMA_KEY;
