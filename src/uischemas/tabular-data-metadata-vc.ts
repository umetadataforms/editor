import { type UiSchema } from '@rjsf/utils';

import CollapsibleArrayItemTempalte from '../templates/CollapsibleArrayItemTempalte';
import CollapsibleArrayTemplate from '../templates/CollapsibleArrayTemplate';

const uiSchema: UiSchema = {
  'ui:globalOptions': {
    enableMarkdownInDescription: true,
    label: true,
    allowClearTextInputs: true,
  } as object,
  $schema: {
    'ui:options': {
      readonly: true
    }
  },
  variables: {
    'ui:options': {
      noFieldset: true,
      ArrayFieldTemplate: CollapsibleArrayTemplate
    },
    items: {
      'ui:options': {
        ObjectFieldTemplate: CollapsibleArrayItemTempalte,
        label: false,
      },
      identifier: {
        'ui:options': {
          readonly: true,
          widget: "hidden"
        }
      },
      description: {
        'ui:options': {
          widget: "TextAreaWidget"
        }
      },
      data_type: {
        'ui:options': {
          autoSelectFirstOption: true
        }
      },
      variable_type: {
        'ui:options': {
          autoSelectFirstOption: true
        }
      },
      statistical_type: {
        'ui:options': {
          autoSelectFirstOption: true
        }
      },
      language: {
        'ui:options': {
          autoSelectFirstOption: true
        }
      },
      categories: {
        'ui:options': {
          noFieldset: true
        },
        items: {
          'ui:options': {
            label: false,
            classNames: 'umfe-list-items'
          }
        }
      },
      ordered: {
        'ui:options': {
          widget: "select",
          showHeader: true
        },
      },
      umls_codes: {
        'ui:options': {
          noFieldset: true
        },
        items: {
          'ui:options': {
            label: false,
            classNames: 'umfe-list-items'
          }
        }
      },
      snomdect_codes: {
        'ui:options': {
          noFieldset: true,
          widget: 'hidden'
        },
        items: {
          'ui:options': {
            label: false,
            classNames: 'umfe-list-items'
          }
        }
      },
      na_strings: {
        'ui:options': {
          noFieldset: true
        },
        items: {
          'ui:options': {
            label: false,
            classNames: 'umfe-list-items'
          }
        }
      },
      measurment_method: {
        'ui:options': {
          widget: "TextAreaWidget"
        }
      },
      references: {
        'ui:options': {
          noFieldset: true
        },
        items: {
          'ui:options': {
            label: false,
            classNames: 'umfe-list-items'
          }
        }
      }
    }
  }
};

export default uiSchema;
