import datasetV002 from '../data/initial/initial-form-data-real-dataset-v0.0.2.json';
import datasetVC from '../data/initial/initial-form-data-real-dataset-vc.json';

import tabV002 from '../data/initial/initial-form-data-tabular-data-v0.0.2';
import tabVC from '../data/initial/initial-form-data-tabular-data-vc.json';

import type { SchemaKey } from './schema-registry';

const INITIAL_FORM_DATA_REG: Record<SchemaKey, Record<string, unknown>> = {
  'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.2.json': datasetV002 as Record<string, unknown>,
  'dataset-metadata-schema-real.json': datasetVC as Record<string, unknown>,
  'https://github.com/umetadataforms/schemas/raw/main/modular/tabular-data-metadata/v0.0.2.json': tabV002 as Record<string, unknown>,
  'tabular-data-metadata-schema.json': tabVC as Record<string, unknown>,
};

export default INITIAL_FORM_DATA_REG;
