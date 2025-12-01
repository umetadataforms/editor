import ex1_1 from '../examples/real-dataset-metadata-v0.0.1-example-1.json';

import ex2_1 from '../examples/real-dataset-metadata-vc-ptb-xl.json';

import { SchemaKey } from './schema-registry';

export type Example = {
  key: string;
  label: string;
  data: Record<string, any>
};

const EXAMPLESREG: Record<SchemaKey, Example[]> = {
  'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.1.json': [
    {
      key: 'ex1_1',
      label: 'Example 1 Dataset',
      data: ex1_1 as any
    }
  ],
  'real-dataset-metadata/vc.json': [
    {
      key: 'ex2_1',
      label: 'ECG Dataset',
      data: ex2_1 as any
    }
  ]
}

export default EXAMPLESREG;
