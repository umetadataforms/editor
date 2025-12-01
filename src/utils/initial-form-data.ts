import datasetV001 from '../data/initial-form-data-real-dataset-v0.0.1.json';
import datasetVC from '../data/initial-form-data-real-dataset-vc.json';

import { SchemaKey } from './schema-registry';

const INITIAL_FORM_DATA: Record<SchemaKey, any> = {
  'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.1.json': datasetV001 as any,
  'real-dataset-metadata/vc.json': datasetVC as any
};

export default INITIAL_FORM_DATA;
