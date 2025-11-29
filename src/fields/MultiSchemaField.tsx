/*!
 * SPDX-License-Identifier: Apache-2.0
 * @license Apache-2.
 *
 * Based on: @rjsf/antd MultiSchemaField (v5.24.12)
 * Source repository: https://github.com/rjsf-team/react-jsonschema-form.git
 * Source file: packages/antd/src/fields/MultiSchemaField.tsx
 * Upstream commit: 41d2d5553
 *
 * Changes: modified by Artur Akbarov.
 */

import { Component } from 'react';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import {
  ANY_OF_KEY,
  deepEquals,
  ERRORS_KEY,
  FieldProps,
  FormContextType,
  getDiscriminatorFieldFromSchema,
  getUiOptions,
  getWidget,
  mergeSchemas,
  ONE_OF_KEY,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
  UiSchema,
  getSchemaType
} from '@rjsf/utils';

/** Type used for the state of the `AnyOfField` component */
type AnyOfFieldState<T = any, S extends StrictRJSFSchema = RJSFSchema> = {
  /** The currently selected option */
  selectedOption: number;
  /** The option schemas after retrieving all $refs */
  retrievedOptions: S[];
  /** Per-option cached formData so values are restored when switching back */
  optionDataCache: Record<number, T | undefined>;
};

class MultiSchemaField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
> extends Component<FieldProps<T, S, F>, AnyOfFieldState<T, S>> {

  // Prevent immediate auto-re-match right after a user-driven option change
  private suppressAutoMatch = false;

  constructor(props: FieldProps<T, S, F>) {
    super(props);

    const {
      formData,
      options,
      registry: { schemaUtils },
    } = this.props;

    const retrievedOptions = options.map((opt: S) => schemaUtils.retrieveSchema(opt, formData));
    const initialSelected = this.getMatchingOption(0, formData, retrievedOptions);

    // Initialize the cache with the current option's data
    const optionDataCache: Record<number, T | undefined> = {};
    if (initialSelected >= 0) {
      optionDataCache[initialSelected] = props.formData as T;
    }

    this.state = {
      retrievedOptions,
      selectedOption: initialSelected,
      optionDataCache,
    };
  }

  componentDidUpdate(prevProps: Readonly<FieldProps<T, S, F>>, prevState: Readonly<AnyOfFieldState<T, S>>) {
    const { formData, options, idSchema } = this.props;
    const { selectedOption, optionDataCache } = this.state;
    let newState: AnyOfFieldState<T, S> = this.state;

    // If the set of options changed, refresh retrieved options but keep cache
    if (!deepEquals(prevProps.options, options)) {
      const {
        registry: { schemaUtils },
      } = this.props;
      const retrievedOptions = options.map((opt: S) => schemaUtils.retrieveSchema(opt, formData));

      // Drop any cache entries that are now out of range
      const prunedCache: Record<number, T | undefined> = {};
      Object.keys(optionDataCache).forEach(k => {
        const idx = parseInt(k, 10);
        if (idx >= 0 && idx < retrievedOptions.length) {
          prunedCache[idx] = optionDataCache[idx];
        }
      });

      newState = { ...newState, retrievedOptions, optionDataCache: prunedCache };
    }

    // When formData changes while staying within the same field (same $id)
    if (!deepEquals(formData, prevProps.formData) && idSchema.$id === prevProps.idSchema.$id) {
      const { retrievedOptions } = newState;

      // Keep the cache updated for the currently selected option
      if (selectedOption >= 0) {
        const updatedCache = { ...newState.optionDataCache, [selectedOption]: formData as T };
        if (!deepEquals(updatedCache, newState.optionDataCache)) {
          newState = { ...newState, optionDataCache: updatedCache };
        }
      }

      // If this change came right after a user option click, skip the bounce-back
      if (this.suppressAutoMatch) {
        this.suppressAutoMatch = false;
      } else {
        const matchingOption = this.getMatchingOption(selectedOption, formData, retrievedOptions);
        if (prevState && matchingOption !== selectedOption) {
          newState = { ...newState, selectedOption: matchingOption };
        }
      }
    }

    if (newState !== this.state) {
      this.setState(newState);
    }
  }

  getMatchingOption(selectedOption: number, formData: any, options: any[]) {
    const {
      schema,
      registry: { schemaUtils },
    } = this.props;

    // FIXME: Fix the hardcoding of 'not applicable'
    // Only special-case the literal "not applicable"
    if (formData === 'not applicable') {
      const idx = options.findIndex((opt: any) => opt && opt.const === 'not applicable');
      if (idx !== -1) {
        return idx;
      }
    }

    // Otherwise, behave exactly like upstream rjsf
    const discriminator = getDiscriminatorFieldFromSchema(schema);
    return schemaUtils.getClosestMatchingOption(
      formData,
      options,
      selectedOption,
      discriminator
    );
  }

  onOptionChange = (option?: string) => {
    const { selectedOption, retrievedOptions, optionDataCache } = this.state;
    const { formData, onChange, registry } = this.props;
    const { schemaUtils } = registry;

    const intOption = option !== undefined ? parseInt(option, 10) : -1;
    if (intOption === selectedOption) {
      return;
    }

    const newOptionSchema = intOption >= 0 ? retrievedOptions[intOption] : undefined;
    const oldOptionSchema = selectedOption >= 0 ? retrievedOptions[selectedOption] : undefined;

    // 1) Save current data for the old option BEFORE switching
    const updatedCache: Record<number, T | undefined> = {
      ...optionDataCache,
      ...(selectedOption >= 0 ? { [selectedOption]: formData as T } : {}),
    };

    // 2) Determine the starting data for the new option
    let newFormData: T | undefined;

    if (intOption >= 0 && updatedCache.hasOwnProperty(intOption)) {
      // Restore previously entered data for this option
      newFormData = updatedCache[intOption] as T | undefined;
    } else {
      // No cached data yet: prepare a clean slate based on your existing sanitize/default rules
      // Start from a cleaned version of the old data
      const sanitized = schemaUtils.sanitizeDataForNewSchema(newOptionSchema, oldOptionSchema, formData);

      if (newOptionSchema) {
        const schemaType = getSchemaType(newOptionSchema);

        if (schemaType === 'object') {
          newFormData = schemaUtils.getDefaultFormState(
            newOptionSchema,
            sanitized,
            'excludeObjectChildren'
          ) as T;
        } else {
          if (schemaType === 'null') {
            // If option is "Unknown = null", actually set the value to null
            newFormData = null as T;
          } else {
            // For primitives with const, use that literal; otherwise undefined
            const constValue = (newOptionSchema as any).const;
            newFormData = (constValue ?? undefined) as T;
          }
        }
      } else {
        newFormData = sanitized as T;
      }
    }

    // Make the selection sticky for the immediate update
    this.suppressAutoMatch = true;

    this.setState(
      { selectedOption: intOption, optionDataCache: updatedCache },
      () => {
        onChange(newFormData as T, undefined, this.getFieldId());
      }
    );
  };

  getFieldId() {
    const { idSchema, schema } = this.props;
    return `${idSchema.$id}${schema.oneOf ? '__oneof_select' : '__anyof_select'}`;
  }

  render() {
    const {
      name,
      disabled = false,
      errorSchema = {},
      formContext,
      onBlur,
      onFocus,
      readonly,
      registry,
      schema,
      uiSchema,
    } = this.props;

    const { widgets, fields, translateString, globalUiOptions, schemaUtils } = registry;
    const { SchemaField: SchemaFieldComponent } = fields;
    const { selectedOption, retrievedOptions } = this.state;

    const {
      widget = 'radio',
      placeholder,
      autofocus,
      autocomplete,
      title = schema.title,
      ...uiOptions
    } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);

    const Widget = getWidget<T, S, F>({ type: 'number' }, widget, widgets);
    const rawErrors = get(errorSchema, ERRORS_KEY, []);
    const fieldErrorSchema = omit(errorSchema, [ERRORS_KEY]);
    const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema, globalUiOptions);

    const option = selectedOption >= 0 ? retrievedOptions[selectedOption] || null : null;
    let optionSchema: S | undefined | null;

    if (option) {
      const { required } = schema;
      optionSchema = required ? (mergeSchemas({ required }, option) as S) : option;
    }

    let optionsUiSchema: UiSchema<T, S, F>[] = [];
    if (ONE_OF_KEY in schema && uiSchema && ONE_OF_KEY in uiSchema) {
      if (Array.isArray(uiSchema[ONE_OF_KEY])) {
        optionsUiSchema = uiSchema[ONE_OF_KEY];
      } else {
        console.warn(`uiSchema.oneOf is not an array for "${title || name}"`);
      }
    } else if (ANY_OF_KEY in schema && uiSchema && ANY_OF_KEY in uiSchema) {
      if (Array.isArray(uiSchema[ANY_OF_KEY])) {
        optionsUiSchema = uiSchema[ANY_OF_KEY];
      } else {
        console.warn(`uiSchema.anyOf is not an array for "${title || name}"`);
      }
    }

    let optionUiSchema = uiSchema;
    if (selectedOption >= 0 && optionsUiSchema.length > selectedOption) {
      optionUiSchema = optionsUiSchema[selectedOption];
    }

    const translateEnum: TranslatableString = title
      ? TranslatableString.TitleOptionPrefix
      : TranslatableString.OptionPrefix;
    const translateParams = title ? [title] : [];

    const enumOptions = retrievedOptions.map((opt: { title?: string }, index: number) => {
      const { title: uiTitle = opt.title } = getUiOptions<T, S, F>(optionsUiSchema[index]);
      return {
        label: uiTitle || translateString(translateEnum, translateParams.concat(String(index + 1))),
        value: index,
      };
    });

    const mergedOptionUiSchema = {
      ...optionUiSchema,
      'ui:options': {
        ...(optionUiSchema?.['ui:options']),
        __insideOneOf: !!schema.oneOf,
        __insideAnyOf: !!schema.anyOf,
      },
    };

    return (
      <div className="panel panel-default panel-body">
        <div className="form-group">
          <Widget
            id={this.getFieldId()}
            name={`${name}${schema.oneOf ? '__oneof_select' : '__anyof_select'}`}
            schema={{ type: 'number', default: 0 } as S}
            onChange={this.onOptionChange}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={disabled || isEmpty(enumOptions)}
            multiple={false}
            rawErrors={rawErrors}
            errorSchema={fieldErrorSchema}
            value={selectedOption >= 0 ? selectedOption : undefined}
            options={{ enumOptions, ...uiOptions }}
            registry={registry}
            formContext={formContext}
            placeholder={placeholder}
            autocomplete={autocomplete}
            autofocus={autofocus}
            label={title ?? name}
            hideLabel={!displayLabel}
            readonly={readonly}
          />
        </div>
        {optionSchema && (
          <SchemaFieldComponent
            {...this.props}
            schema={optionSchema}
            uiSchema={mergedOptionUiSchema}
          />
        )}
      </div>
    );
  }
}

export default MultiSchemaField;
