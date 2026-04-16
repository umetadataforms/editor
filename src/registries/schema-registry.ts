import type { RJSFSchema, UiSchema } from '@rjsf/utils';

import datasetV002 from '../schemas/real-dataset-metadata/v0.0.2.json';
import datasetV002Ui from '../uischemas/real-dataset-metadata-v0.0.2';

import datasetVC from '../schemas/real-dataset-metadata/vc.json';
import datasetVCUi from '../uischemas/real-dataset-metadata-vc';

import tabV001 from '../schemas/tabular-data-metadata/v0.0.2.json';
import tabV001Ui from '../uischemas/tabular-data-metadata-v0.0.2';

import tabVC from '../schemas/tabular-data-metadata/vc.json';
import tabVCUi from '../uischemas/tabular-data-metadata-vc';

export type SchemaKey =
  | 'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.2.json'
  | 'dataset-metadata-schema-real.json'
  | 'https://github.com/umetadataforms/schemas/raw/main/modular/tabular-data-metadata/v0.0.2.json'
  | 'tabular-data-metadata-schema.json';

export const DEFAULT_SCHEMA_KEY:
 SchemaKey = 'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.2.json';
// export const DEFAULT_SCHEMA_KEY:
//  SchemaKey = 'https://github.com/umetadataforms/schemas/raw/main/modular/tabular-data-metadata/v0.0.2.json';

// export const DEFAULT_SCHEMA_KEY: SchemaKey = 'dataset-metadata-schema-real.json';
// export const DEFAULT_SCHEMA_KEY: SchemaKey = 'tabular-data-metadata-schema.json';

export type RegistryEntry = {
  label: string;
  schema: RJSFSchema;
  uischema: UiSchema;
};

export type SchemaReg = Record<SchemaKey, RegistryEntry>;

export const SCHEMAREG: SchemaReg = {
  'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.2.json':
  {
    label: 'Real Dataset Metadata v0.0.2',
    schema: datasetV002 as RJSFSchema,
    uischema: datasetV002Ui as UiSchema,
  },
  'dataset-metadata-schema-real.json': {
    label: 'Real Dataset Metadata (AISym4Med)',
    schema: datasetVC as RJSFSchema,
    uischema: datasetVCUi as UiSchema,
  },
  'https://github.com/umetadataforms/schemas/raw/main/modular/tabular-data-metadata/v0.0.2.json': {
    label: 'Tabular Data Metadata v0.0.2',
    schema: tabV001 as unknown as RJSFSchema,
    uischema: tabV001Ui as UiSchema,
  },
  'tabular-data-metadata-schema.json': {
    label: 'Tabular Data Metadata (AISym4Med)',
    schema: tabVC as RJSFSchema,
    uischema: tabVCUi as UiSchema,
  },
};

export default SCHEMAREG;
