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
    xFieldDescriptionDisplay: false
  },
  // UI options for individual fields
  schema: {
    'ui:options': {
      readonly: true
    }
  },
  label: {
    'ui:options': {
    }
  },
  version: {
    oneOf: [
      {
        'ui:options': {
          title: "Edit"
        }
      }
    ]
  },
  versionDate: {
    'ui:options': {
    }
  },
  versionInfo: {
    oneOf: [
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
    oneOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  baseline: {
    oneOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  inclusionCriteria: {
    oneOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  exclusionCriteria: {
    oneOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  targets: {
    oneOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  studyDesign: {
    oneOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  temporalCoverage: {
    'ui:options': {
    }
  },
  geographicCoverage: {
    oneOf: [
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
              xFieldDescriptionDisplay: false
            },
            countryCode: {
              'ui:options': {
                widget: 'CountryWidget',
                xFieldDescriptionDisplay: false
              }
            },
            countrySubdivisionCodes: {
              'ui:options': {
              },
              items: {
                'ui:options': {
                  widget: 'CountrySubdivisionWidget',
                  label: false,
                  xFieldDescriptionDisplay: false
                }
              },
            }
          }
        }
      }
    ]
  },
  dataSampling: {
    oneOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  acquisitionMethods: {
    oneOf: [
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
      },
      {
        'ui:options': {
          readonly: true
        }
      }
    ]
  },
  limitations: {
    oneOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  dataPreprocessing: {
    oneOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  healthcareSettings: {
    oneOf: [
      {
        'ui:options': {
          label: false
        },
        items: {
          'ui:options': {
            label: false,
            classNames: 'x-list-items'
          }
        }
      }
    ]
  },
  patientNum: {
    'ui:options': {
    }
  },
  dataSources: {
    oneOf: [
      {
        'ui:options': {
          label: false
        },
        items: {
          'ui:options': {
            label: false,
            xFieldDescriptionDisplay: true,
            classNames: 'x-list-items'
          },
          url: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          title: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          description: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          }

        }
      }
    ]
  },
  additionalDocumentation: {
    'ui:options': {
      xDescriptionLocation: 'above'
    },
    oneOf: [
      {
        'ui:options': {
          label: false,
        },
        items: {
          'ui:options': {
            label: false,
            classNames: 'x-list-items'
          },
          url: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          path: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          format: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          sha256: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          title: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          description: {
            'ui:options': {
              widget: "TextAreaWidget",
              xFieldDescriptionLocation: 'below'
            }
          }
        }
      }
    ]
  },
  dataFormats: {
    items: {
      'ui:options': {
        label: false,
        classNames: 'x-list-items'
      },
      anyOf: [
        {
          'ui:options': {
            label: false
          },
          dataModality: {
            'ui:options': {
              widget: "hidden"
            }
          },
          dataFormats: {
            'ui:options': {
              label: false
            },
            items: {
              'ui:options': {
                label: false
              },
            }
          }
        },
        {
          'ui:options': {
            label: false
          },
          dataModality: {
            'ui:options': {
              widget: "hidden"
            }
          },
          dataFormats: {
            'ui:options': {
              label: false
            },
            items: {
              'ui:options': {
                label: false
              },
            }
          }
        },
        {
          'ui:options': {
            label: false
          },
          dataModality: {
            'ui:options': {
              widget: "hidden"
            }
          },
          dataFormats: {
            'ui:options': {
              label: false
            },
            items: {
              'ui:options': {
                label: false
              },
            }
          }
        }

      ]
    }
  },
  privacyCompliance: {
    oneOf: [
      {
        'ui:options': {
          widget: "TextAreaWidget",
          title: "Edit"
        }
      }
    ]
  },
  ethicsApproval: {
    'ui:options': {
    },
    oneOf: [
      {
        'ui:options': {
          label: false
        },
        items: {
          'ui:options': {
            label: false,
            xFieldDescriptionLocation: 'below'
          },
          approvalStatus: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          approvalDate: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          approvalAuthority: {
            'ui:options': {
              widget: "TextAreaWidget",
              xFieldDescriptionLocation: 'below'
            }
          },
          approvalNumber: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          approvalDetails: {
            'ui:options': {
              widget: "TextAreaWidget",
              xFieldDescriptionLocation: 'below'
            }
          }
        }
      }
    ]
  },
  patientConsent: {
    oneOf: [
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
    oneOf: [
      {
        'ui:options': {
          title: "Edit",
          widget: "TextAreaWidget"
        }
      }
    ]
  },
  owners: {
    'ui:options': {
      xDescriptionLocation: 'above'
    },
    oneOf: [
      {
        'ui:options': {
          label: false
        },
        items: {
          name: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          website: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          address: {
            'ui:options': {
              xFieldDescriptionLocation: 'below'
            }
          },
          country: {
            'ui:options': {
              widget: 'CountryWidget',
              xFieldDescriptionLocation: 'below'
            }
          },
          contactDetails: {
            anyOf: [
              {
                'ui:options': {
                  label: false
                },
                email: {
                  'ui:options': {
                    xFieldDescriptionLocation: 'below'
                  }
                },
                telephone: {
                  'ui:options': {
                    xFieldDescriptionLocation: 'below'
                  }
                },
                comments: {
                  'ui:options': {
                    xFieldDescriptionLocation: 'below'
                  }
                }
              },
              {
                'ui:options': {
                  label: false
                },
                items: {
                  'ui:options': {
                    label: false
                  },
                  firstName: {
                    'ui:options': {
                      xFieldDescriptionLocation: 'below'
                    }
                  },
                  role: {
                    'ui:options': {
                      xFieldDescriptionLocation: 'below'
                    }
                  },
                  lastName: {
                    'ui:options': {
                      xFieldDescriptionLocation: 'below'
                    }
                  },
                  email: {
                    'ui:options': {
                      xFieldDescriptionLocation: 'below'
                    }
                  },
                  telephone: {
                    'ui:options': {
                      xFieldDescriptionLocation: 'below'
                    }
                  },
                  comments: {
                    'ui:options': {
                      xFieldDescriptionLocation: 'below'
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
  doi: {
    'ui:options': {
    }
  },
  howToCite: {
    oneOf: [
      {
        'ui:options': {
          label: false
        },
        instructions: {
          oneOf: [
            {
              'ui:options': {
                title: "Edit",
                widget: "TextAreaWidget"
              }
            },
            {
              'ui:options': {
                readonly: true
              }
            }
          ]
        },
        citations: {
          'ui:options': {
            xDescriptionDisplay: 'above'
          },
          items: {
            'ui:options': {
              label: false,
              xFieldDescriptionLocation: 'none'
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
      {
        'ui:options': {
          readonly: true
        }
      }
    ]
  },
  modellingTasks: {
    items: {
      'ui:options': {
        label: false,
        xDescriptionDisplay: false
      },
      anyOf: [
        { // Pre-defined task
          'ui:options': {
            label: false,
            xDescriptionDisplay: false
          }
        },
        { // Custom task
          'ui:options': {
            label: false,
            xDescriptionDisplay: false
          }
        }
      ]
    }
  },
  keywords: {
    items: {
      'ui:options': {
        label: false
      }
    }
  },
  licence: {
    oneOf: [
      { // URL Link
        'ui:options': {
          label: false
        },
        url: {
          'ui:options': {
            xFieldDescriptionLocation: 'below',
          }
        },
        title: {
          'ui:options': {
            xFieldDescriptionLocation: 'below'
          }
        },
        description: {
          'ui:options': {
            xFieldDescriptionLocation: 'below'
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
