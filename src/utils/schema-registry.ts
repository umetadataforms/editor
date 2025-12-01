import { RJSFSchema, UiSchema } from '@rjsf/utils';

import datasetV001 from '../schemas/real-dataset-metadata/v0.0.1.json';
import datasetV001Ui from '../uischemas/real-dataset-metadata-v0.0.1';

import datasetVC from '../schemas/real-dataset-metadata/vc.json';
import datasetVCUi from '../uischemas/real-dataset-metadata-vc';

export type SchemaKey =
  | 'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.1.json'
  | 'real-dataset-metadata/vc.json';

// export const DEFAULT_SCHEMA_KEY: SchemaKey = 'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.1.json';
export const DEFAULT_SCHEMA_KEY: SchemaKey = 'real-dataset-metadata/vc.json';

export type RegistryEntry = {
  label: string;
  schema: RJSFSchema;
  uischema: UiSchema;
};

export type SchemaReg = Record<SchemaKey, RegistryEntry>;

export const SCHEMAREG: SchemaReg = {
  'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.1.json':
  {
    label: 'Real Dataset Metadata v0.0.1',
    schema: datasetV001 as RJSFSchema,
    uischema: datasetV001Ui as UiSchema,
  },
  'real-dataset-metadata/vc.json': {
    label: 'Real Dataset Metadata (AISym4Med)',
    schema: datasetVC as RJSFSchema,
    uischema: datasetVCUi as UiSchema,
  },
};

export default SCHEMAREG;
