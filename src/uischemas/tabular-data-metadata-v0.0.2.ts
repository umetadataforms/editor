import { type UiSchema } from '@rjsf/utils';

import CollapsibleArrayItemTempalte from '../templates/CollapsibleArrayItemTempalte';
import CollapsibleArrayTemplate from '../templates/CollapsibleArrayTemplate';

const uiSchema: UiSchema = {
  'ui:globalOptions': {
    enableMarkdownInDescription: true,
    label: true,
    allowClearTextInputs: true,
  } as object,
  schema: {
    'ui:options': {
      readonly: true
    }
  },
  files: {
    'ui:options': {
      noFieldset: true,
      ArrayFieldTemplate: CollapsibleArrayTemplate,
      tooltipSuffix: 'file',
    },
    items: {
      'ui:options': {
        ObjectFieldTemplate: CollapsibleArrayItemTempalte,
        tooltipSuffix: 'file',
      },
      description: {
        'ui:options': {
          widget: 'TextAreaWidget',
        },
      },
    },
  },
  fields: {
    'ui:options': {
      ArrayFieldTemplate: CollapsibleArrayTemplate,
      noFieldset: true,
      tooltipSuffix: 'field',
    },
    items: {
      'ui:options': {
        ObjectFieldTemplate: CollapsibleArrayItemTempalte,
        tooltipSuffix: 'field',
      },
      description: {
        'ui:options': {
          widget: 'TextAreaWidget',
        },
      },
      dateFormat: {
        anyOf: [
          {},
          {
            'ui:options': {
              widget: 'NotApplicableWidget',
            },
          },
        ],
      },
      measurementType: {
        'ui:options': {
          autoSelectFirstOption: true,
        },
        anyOf: [
          {},
          {},
          {
            'ui:options': {
              widget: 'NotApplicableWidget',
            },
          },
          {
            'ui:options': {
              widget: 'UnknownWidget',
            },
          },
        ],
      },
      role: {
        'ui:options': {
          autoSelectFirstOption: true,
        },
        anyOf: [
          {},
          {},
          {
            'ui:options': {
              widget: 'UnknownWidget',
            },
          },
        ],
      },
      units: {
        'ui:options': {
          autoSelectFirstOption: true,
        },
        anyOf: [
          {},
          {
            'ui:options': {
              widget: 'UnknownWidget',
            },
          },
        ],
      },
      missingValueCode: {
        'ui:options': {
          autoSelectFirstOption: true,
        },
        anyOf: [
          {},
          {},
          {
            'ui:options': {
              widget: 'UnknownWidget',
            },
          },
        ],
      },
      categories: {
        'ui:options': {
          noFieldset: true,
          orderable: false,
          tooltipSuffix: 'category',
        },
        anyOf: [
          {},
          {
            'ui:options': {
              widget: 'NotApplicableWidget',
              label: false
            }
          },
          {
            'ui:options': {
              widget: 'UnknownWidget',
            },
          },
        ],
        items: {
          'ui:options': {
            label: false,
            gridCols: 2,
            gridSpacing: 'xs',
            gridVerticalSpacing: 'xs',
            gridTemplateColumns: '70% 30%',
            tooltipSuffix: 'category',
            classNames: 'umfe-tabular-category-item',
          },
          tags: {
            'ui:options': {
              noFieldset: true,
              orderable: false,
              tooltipSuffix: 'tag',
            },
            items: {
              'ui:options': {
                tooltipSuffix: 'tag',
                label: false,
                gridCols: 2,
                gridSpacing: 'xs',
                gridVerticalSpacing: 'xs',
                gridTemplateColumns: '70% 30%',
                classNames: 'umfe-tag-item',
              },
              isPrimary: {
                'ui:options': {
                  widget: 'InlineLabelCheckboxWidget',
                  label: false,
                },
              },
              anyOf: [
                {
                  code: {
                    'ui:options': {
                      autoSelectFirstOption: true,
                    },
                  },
                },
                {
                  code: {
                    'ui:options': {
                      autoSelectFirstOption: true,
                    },
                  },
                  vocabulary: {
                    'ui:options': {
                      label: false,
                    },
                  },
                  vocabularyVersion: {
                    'ui:options': {
                      label: false,
                    },
                  },
                },
              ],
            },
          },
        },
      },
      resources: {
        'ui:options': {
          noFieldset: true,
          orderable: false,
          tooltipSuffix: 'resource'
        },
        anyOf: [
          {
            items: {
              'ui:options': {
                label: false,
                classNames: 'umfe-tabular-resource-item',
              },
              anyOf: [
                {
                  'ui:options': {
                    label: false,
                  },
                  description: {
                    'ui:options': {
                      widget: 'TextAreaWidget',
                    },
                  },
                },
                {
                  'ui:options': {
                    label: false,
                  },
                  description: {
                    'ui:options': {
                      widget: 'TextAreaWidget',
                    },
                  },
                },
              ],
            },
          },
          {
            'ui:options': {
              widget: 'UnknownWidget',
            },
          },
        ],
      },
      tags: {
        'ui:options': {
          noFieldset: true,
          orderable: false,
          tooltipSuffix: 'tag',
        },
        items: {
          'ui:options': {
            tooltipSuffix: 'tag',
            label: false,
            gridCols: 2,
            gridSpacing: 'xs',
            gridVerticalSpacing: 'xs',
            gridTemplateColumns: '70% 30%',
            classNames: 'umfe-tag-item',
          },
          isPrimary: {
            'ui:options': {
              widget: 'InlineLabelCheckboxWidget',
              label: false,
            },
          },
          anyOf: [
            {
              code: {
                'ui:options': {
                  autoSelectFirstOption: true,
                },
              },
            },
            {
              code: {
                'ui:options': {
                  autoSelectFirstOption: true,
                },
              },
              vocabulary: {
                'ui:options': {
                  label: false,
                },
              },
              vocabularyVersion: {
                'ui:options': {
                  label: false,
                },
              },
            },
          ],
        },
      },
    },
  },
};

export default uiSchema;
