import ds003844Vc from '../data/examples/ds003844/real-dataset-metadata-vc.json';
import ptbxlVc from '../data/examples/ptbxl/real-dataset-metadata-vc.json';
import ucilmr45Vc from '../data/examples/ucimlr45/real-dataset-metadata-vc.json';

import ds003844V002 from '../data/examples/ds003844/real-dataset-metadata-v0.0.2.json';
import ptbxlV002 from '../data/examples/ptbxl/real-dataset-metadata-v0.0.2.json';
import ucilmr45V002 from '../data/examples/ucimlr45/real-dataset-metadata-v0.0.2.json';

import ds003844TabVc from '../data/examples/ds003844/tabular-data-metadata-vc.json';
import ptbxlTabVc from '../data/examples/ptbxl/tabular-data-metadata-vc.json';
import ucilmr45TabVc from '../data/examples/ucimlr45/tabular-data-metadata-vc.json';

import ds003844TabV002 from '../data/examples/ds003844/tabular-data-metadata-v0.0.2.json';
import ptbxlTabV002 from '../data/examples/ptbxl/tabular-data-metadata-v0.0.2.json';
import ucilmr45TabV002 from '../data/examples/ucimlr45/tabular-data-metadata-v0.0.2.json';

import type { SchemaKey } from './schema-registry';

export type Example = {
  key: string;
  label: string;
  data: Record<string, unknown>
};

const EXAMPLESREG: Record<SchemaKey, Example[]> = {
  'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.2.json': [
    {
      key: 'ds003844_v002',
      label: 'RESPect ds003844 (v0.0.2)',
      data: ds003844V002 as Record<string, unknown>
    },
    {
      key: 'ptbxl_v002',
      label: 'PTB-XL (v0.0.2)',
      data: ptbxlV002 as Record<string, unknown>
    },
    {
      key: 'heart_disease_v002',
      label: 'Cleveland Heart Disease (v0.0.2)',
      data: ucilmr45V002 as Record<string, unknown>
    }
  ],
  'dataset-metadata-schema-real.json': [
    {
      key: 'ds003844_vc',
      label: 'RESPect ds003844 (AISym4Med)',
      data: ds003844Vc as Record<string, unknown>
    },
    {
      key: 'ptbxl_vc',
      label: 'PTB-XL (AISym4Med)',
      data: ptbxlVc as Record<string, unknown>
    },
    {
      key: 'heart_disease_vc',
      label: 'Cleveland Heart Disease (AISym4Med)',
      data: ucilmr45Vc as Record<string, unknown>
    }
  ],
  'https://github.com/umetadataforms/schemas/raw/main/modular/tabular-data-metadata/v0.0.2.json': [
    {
      key: 'ds003844_tabular_v002',
      label: 'RESPect ds003844 Variables (v0.0.2)',
      data: ds003844TabV002 as Record<string, unknown>
    },
    {
      key: 'ptbxl_tabular_v002',
      label: 'PTB-XL Variables (v0.0.2)',
      data: ptbxlTabV002 as Record<string, unknown>
    },
    {
      key: 'heart_disease_tabular_v002',
      label: 'Cleveland Heart Disease Variables (v0.0.2)',
      data: ucilmr45TabV002 as Record<string, unknown>
    }
  ],
  'tabular-data-metadata-schema.json': [
    {
      key: 'ds003844_tabular_vc',
      label: 'RESPect ds003844 Variables (AISym4Med)',
      data: ds003844TabVc as Record<string, unknown>
    },
    {
      key: 'ptbxl_tabular_vc',
      label: 'PTB-XL Variables (AISym4Med)',
      data: ptbxlTabVc as Record<string, unknown>
    },
    {
      key: 'heart_disease_tabular_vc',
      label: 'Cleveland Heart Disease Variables (AISym4Med)',
      data: ucilmr45TabVc as Record<string, unknown>
    }
  ]
};

export default EXAMPLESREG;
