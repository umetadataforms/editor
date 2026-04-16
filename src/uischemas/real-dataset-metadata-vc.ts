import { type UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:globalOptions': {
    enableMarkdownInDescription: true,
    label: true,
    allowClearTextInputs: true,
  } as object,
  "$schema": {
    'ui:options': {
      readonly: true
    }
  },
  version_info: {
    'ui:options': {
      widget: 'TextAreaWidget',
    },
  },
  description: {
    'ui:options': {
      widget: 'TextAreaWidget',
    },
  },
  purpose: {
    'ui:options': {
      widget: 'TextAreaWidget',
    },
  },
  study_design: {
    'ui:options': {
      widget: "TextAreaWidget",
    }
  },
  patient_criteria: {
    'ui:options': {
      widget: "TextAreaWidget",
    }
  },
  target_variables: {
    'ui:options': {
      widget: "TextAreaWidget",
    }
  },
  time_zero: {
    'ui:options': {
      widget: "TextAreaWidget",
    }
  },
  spatial_coverage: {
    'ui:options': {
      noFieldset: true
    },
    items: {
      'ui:options': {
        widget: 'CountryWidgetTempAlpha3',
        label: false,
        classNames: 'umfe-list-items'
      }
    }
  },
  source_urls: {
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
  acquisition_methods: {
    'ui:options': {
      widget: "TextAreaWidget",
    }
  },
  documentation: {
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
  publications: {
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
  data_modalities: {
    'ui:options': {
      noFieldset: true,
      widget: "select",
      showHeader: true
    },
    items: {
      'ui:options': {
        label: false,
        classNames: 'umfe-list-items'
      }
    }
  },
  privacy_compliance: {
    'ui:options': {
      widget: "TextAreaWidget",
    }
  },
  ethics_approval: {
    obtained: {
      'ui:options': {
        widget: "select",
      }
    },
    details: {
      'ui:options': {
        widget: "TextAreaWidget",
      }
    }
  },
  patient_consent: {
    obtained: {
      'ui:options': {
        widget: "select",
      }
    },
    details: {
      'ui:options': {
        widget: "TextAreaWidget",
      }
    }
  },
  funder: {
    'ui:options': {
      widget: "TextAreaWidget"
    }
  },
  owner: {
    'ui:options': {
      widget: "TextAreaWidget"
    }
  },
  licence: {
    'ui:options': {
      widget: "TextAreaWidget"
    }
  },
  citation: {
    'ui:options': {
      widget: "TextAreaWidget"
    }
  },
  tasks: {
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
  keywords: {
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

export default uiSchema;
