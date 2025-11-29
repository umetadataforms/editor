import ex1_1 from '../examples/real-dataset-metadata-v0.0.1-example-1.json';
// import ex1_2 from '../examples/real-dataset-metadata-v0.0.1-example-2.json';

import ex2_1 from '../examples/real-dataset-metadata-vc-ptb-xl.json';
// import ex2_2 from '../examples/real-dataset-metadata-vc-ds003844.json';

export type Example = {
  key: string;
  label: string;
  data: Record<string, any>
};

const EXAMPLESREG: Record<string, Example[]> = {
  'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.1.json': [
    {
      key: 'ex1_1',
      label: 'Example 1 Dataset',
      data: ex1_1 as any
    },
    // {
    //   key: 'ex1_2',
    //   label: 'iEEG Dataset',
    //   data: ex1_2 as any
    // }
  ],
  'dataset-metadata-schema-real.json': [
    {
      key: 'ex2_1',
      label: 'ECG Dataset',
      data: ex2_1 as any
    },
    // {
    //   key: 'ex2_2',
    //   label: 'iEEG Dataset',
    //   data: ex2_2 as any
    // }
  ]
}

export default EXAMPLESREG;
