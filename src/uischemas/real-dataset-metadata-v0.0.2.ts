import { type UiSchema } from '@rjsf/utils';

const uiSchema: UiSchema = {
  'ui:globalOptions': {
    enableMarkdownInDescription: true,
    label: true,
    allowClearTextInputs: true,
  } as object,
  // UI options for individual fields
  schema: {
    'ui:options': {
      readonly: true
    }
  },
  version: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit"
        }
      }
    ]
  },
  versionInfo: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  summary: {
    'ui:options': {
      widget: "TextAreaWidget"
    }
  },
  purpose: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  baseline: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget",
        }
      }
    ]
  },
  inclusionCriteria: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  exclusionCriteria: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  targets: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  studyDesign: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  geographicCoverage: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          label: false
        },

        geographicInfo: {
          'ui:options': {
            widget: "TextAreaWidget"
          }
        },
        geographicAreas: {
          items: {
            'ui:options': {
              label: false,
            },
            countryCode: {
              'ui:options': {
                widget: 'CountryWidget',
              }
            },
            countrySubdivisionCodes: {
              items: {
                'ui:options': {
                  widget: 'CountrySubdivisionWidget',
                  label: false,
                }
              },
            }
          }
        }
      }
    ]
  },
  dataSampling: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  acquisitionMethods: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  annotationMethods: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  limitations: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  dataPreprocessing: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  healthcareSettings: {
    anyOf: [
      {
        'ui:options': {
          label: false
        },
        items: {
          'ui:options': {
            label: false,
            classNames: 'umfe-list-items'
          }
        }
      }
    ]
  },
  dataSources: {
    anyOf: [
      {
        items: {
          'ui:options': {
            classNames: 'umfe-list-items'
          },
          description: {
            'ui:options': {
              widget: "TextAreaWidget",
            }
          }
        }
      }
    ]
  },
  additionalDocumentation: {
    anyOf: [
      {
        items: {
          'ui:options': {
            label: false,
            classNames: 'umfe-list-items'
          },
          description: {
            'ui:options': {
              widget: "TextAreaWidget",
            }
          }
        }
      }
    ]
  },
  dataModalities: {
    'ui:options': {
      noFieldset: true
    },
    items: {
      'ui:options': {
        label: false,
        classNames: 'umfe-list-items'
      },
      anyOf: [
        {
          dataModality: {
            'ui:options': {
              readonly: true,
            }
          },
          dataFormats: {
            items: {
              'ui:options': {
                label: false
              }
            }
          }
        },
        {
          dataModality: {
            'ui:options': {
              readonly: true,
            }
          },
          dataFormats: {
            items: {
              'ui:options': {
                label: false
              }
            }
          }
        },
        {
          dataModality: {
            'ui:options': {
              readonly: true,
            }
          },
          dataFormats: {
            items: {
              'ui:options': {
                label: false
              }
            }
          }
        },
        {
          dataFormats: {
            items: {
              'ui:options': {
                label: false
              }
            }
          }
        }
      ]
    }
  },
  privacyCompliance: {
    anyOf: [
      {
        'ui:options': {
          widget: "TextAreaWidget",
          title: "Edit"
        }
      }
    ]
  },
  ethicsApproval: {
    anyOf: [
      {
        'ui:options': {
          label: false
        },
        items: {
          'ui:options': {
            label: false,
          },
          approvalAuthority: {
            'ui:options': {
              widget: "TextAreaWidget",
            }
          },
          approvalDetails: {
            'ui:options': {
              widget: "TextAreaWidget",
            }
          }
        }
      }
    ]
  },
  patientConsent: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  acknowledgements: {
    'ui:options': {
      widget: "TextAreaWidget"
    }
  },
  funding: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  owners: {
    anyOf: [
      {
        items: {
          address: {
            'ui:options': {
              widget: 'TextAreaWidget',
            }
          },
          country: {
            'ui:options': {
              widget: 'CountryWidget',
            }
          },
          contactDetails: {
            anyOf: [
              {
                comments: {
                  'ui:options': {
                    widget: 'TextAreaWidget',
                  }
                }
              },
              {
                items: {
                  comments: {
                    'ui:options': {
                      widget: 'TextAreaWidget',
                    }
                  }
                }
              }
            ]
          }
        }
      }
    ]
  },
  howToCite: {
    anyOf: [
      {
        'ui:options': {
          label: false
        },
        instructions: {
          anyOf: [
            {
              'ui:options': {
                title: "Edit",
                widget: "TextAreaWidget"
              }
            },
          ]
        },
        citations: {
          items: {
            'ui:options': {
              label: false,
            }
          }
        }
      }
    ]
  },
  references: {
    anyOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      },
    ]
  },
  modellingTasks: {
    'ui:options': {
      noFieldset: true
    },
    items: {
      'ui:options': {
        label: false,
        classNames: 'umfe-list-items'
      },
    }
  },
  keywords: {
    'ui:options': {
      noFieldset: true
    },
    items: {
      'ui:options': {
        label: false
      }
    }
  },
  licence: {
    anyOf: [
      { // URL Link
        description: {
          'ui:options': {
            widget: "TextAreaWidget",
          }
        }
      },
      { // Licence Text
        'ui:options': {
          widget: "TextAreaWidget",
          label: true
        }
      }
    ]
  }
}

export default uiSchema;
