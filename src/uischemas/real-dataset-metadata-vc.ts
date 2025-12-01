import { type UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:globalOptions': {
    // Default global extra options
    xLabelDisplay: undefined,
    xObjectDescriptionDisplay: true,
    xArrayDescriptionDisplay: true,
    xFieldDescriptionDisplay: true,
    xFieldDescriptionLocation: 'above',
    xDescriptionAsDetails: false,
    xDescriptionAsDetailsOpen: false,
    // These are global only
    xGlobalMultiSchemaAltLabelDisplay: false,
    xGlobalMultiSchemaAltDescriptionDisplay: true,
    xGlobalMultiSchemaAltDescriptionLocation: 'below',
    xGlobalMultiSchemaAltDescriptionAsDetails: false,
    xGlobalMultiSchemaAltDescriptionAsDetailsOpen: false
  } as object,
  // Root UI options
  'ui:options': {
    xDescriptionAsDetails: false,
    // The description is displayed by the object template
    xFieldDescriptionDisplay: false,
    headingTag: "h1"
  },
  // UI options for individual fields
  '$schema': {
    'ui:options': {
      readonly: true
    }
  },
  identifier: {
    'ui:options': {
      readonly: true
    }
  },
  label: {},
  version: {},
  version_info: {
    'ui:options': {
      widget: "TextAreaWidget",
      headingTag: "h2",
      isTopLevel: true
    }
  },
  version_date: {
    'ui:options': {
      headingTag: "h2",
      isTopLevel: true
    }
  },
  title: {},
  description: {
    'ui:options': {
      widget: "TextAreaWidget"
    }
  },
  purpose: {
    'ui:options': {
      widget: "TextAreaWidget"
    }
  },
  disease: {},
  study_design: {
    'ui:options': {
      widget: "TextAreaWidget",
      headingTag: "h2",
      isTopLevel: true
    }
  },
  patient_num: {
    'ui:options': {
      headingTag: "h2",
      isTopLevel: true
    }
  },
  patient_criteria: {
    'ui:options': {
      widget: "TextAreaWidget",
      headingTag: "h2",
      isTopLevel: true
    }
  },
  target_variables: {
    'ui:options': {
      widget: "TextAreaWidget",
      headingTag: "h2",
      isTopLevel: true
    }
  },
  time_zero: {
    'ui:options': {
      widget: "TextAreaWidget",
      headingTag: "h2",
      isTopLevel: true

    }
  },
  temporal_coverage: {
    'ui:options': {
      headingTag: "h2",
      isTopLevel: true
    },
    start_date: {
      'ui:options': {
        headingTag: "h3"
      }
    },
    end_date: {
      'ui:options': {
        headingTag: "h3"
      }
    }
  },
  spatial_coverage: {
    'ui:options': {
      headingTag: "h2",
      isTopLevel: true
    },
    items: {
      'ui:options': {
        widget: 'CountryWidgetTempAlpha3',
        label: false,
        xFieldDescriptionDisplay: false,
        classNames: 'x-list-items'
      }
    }
  },
  source_urls: {
    'ui:options': {
      headingTag: "h2",
      isTopLevel: true
    },
    items: {
      'ui:options': {
        label: false,
        xFieldDescriptionDisplay: true,
        classNames: 'x-list-items'
      }
    }
  },
  acquisition_methods: {
    'ui:options': {
      widget: "TextAreaWidget",
      headingTag: "h2",
      isTopLevel: true
    }
  },
  healthcare_setting: {
    'ui:options': {
      headingTag: "h2",
      isTopLevel: true
    }
  },
  documentation: {
    items: {
      'ui:options': {
        label: false,
        classNames: 'x-list-items'
      }
    }
  },
  publications: {
    items: {
      'ui:options': {
        label: false,
        xDescriptionDisplay: false,
        classNames: 'x-list-items'
      }
    }
  },
  data_modalities: {
    'ui:options': {
      headingTag: "h2",
      isTopLevel: true
    },
    items: {
      'ui:options': {
        label: false,
        xDescriptionDisplay: false,
        classNames: 'x-list-items'
      }
    }
  },
  privacy_compliance: {
    'ui:options': {
      widget: "TextAreaWidget",
      headingTag: "h2",
      isTopLevel: true
    }
  },
  ethics_approval: {
    'ui:options': {
      xDescriptionLocation: 'above',
      headingTag: "h2",
      isTopLevel: true
    },
    obtained: {
      'ui:options': {
        widget: "radio",
        headingTag: "h3",
        xLabelDisplay: true
      }
    },
    obtained_date: {
      'ui:options': {
        headingTag: "h3",
      }
    },
    register_number: {
      'ui:options': {
        headingTag: "h3"
      }
    },
    details: {
      'ui:options': {
        widget: "TextAreaWidget",
        headingTag: "h3"
      }
    }
  },
  patient_consent: {
    'ui:options': {
      xDescriptionLocation: 'above',
      headingTag: "h2",
      isTopLevel: true
    },
    obtained: {
      'ui:options': {
        widget: "radio",
        headingTag: "h3",
        xLabelDisplay: true
      }
    },
    obtained_date: {
      'ui:options': {
        headingTag: "h3"
      }
    },
    details: {
      'ui:options': {
        widget: "TextAreaWidget",
        headingTag: "h3"
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
  licence_url: {
    'ui:options': {
      headingTag: "h2",
      isTopLevel: true
    }
  },
  doi: {},
  citation: {
    'ui:options': {
      widget: "TextAreaWidget"
    }
  },
  tasks: {
    items: {
      'ui:options': {
        label: false,
        xDescriptionDisplay: false,
        classNames: 'x-list-items'
      }
    }
  },
  format: {
    'ui:options': {
      headingTag: "h2"
    }
  },
  keywords: {
    items: {
      'ui:options': {
        label: false,
        xDescriptionDisplay: false,
        classNames: 'x-list-items'
      }
    }
  }
}

export default uiSchema;
