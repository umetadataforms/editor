import { Component } from 'react';

import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import type {
  FieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  ANY_OF_KEY,
  deepEquals,
  ERRORS_KEY,
  getDiscriminatorFieldFromSchema,
  getUiOptions,
  getWidget,
  getSchemaType,
  mergeSchemas,
  ONE_OF_KEY,
  TranslatableString,
} from '@rjsf/utils';
import { HeadingDepthProvider } from '../components/HeadingDepthContext';
import MultiSchemaRadioWidget from '../widgets/MultiSchemaRadioWidget';

/** Type used for the state of the `MultiSchemaField` component */
type AnyOfFieldState<T = unknown, S extends StrictRJSFSchema = RJSFSchema> = {
  /** The currently selected option */
  selectedOption: number;
  /** The option schemas after retrieving all $refs */
  retrievedOptions: S[];
  /** Per-option cached formData so values are restored when switching back */
  optionDataCache: Record<number, T | undefined>;
};

/**
 * Field renderer for oneOf/anyOf schemas with cached option data and manual selection.
 */
class MultiSchemaField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType
> extends Component<FieldProps<T, S, F>, AnyOfFieldState<T, S>> {

  // Prevent immediate auto-re-match right after a user-driven option change
  private suppressAutoMatch = false;
  private lastCachedFormData: T | undefined;

  private getOptionUiSchema(selectedOption: number): UiSchema<T, S, F> | undefined {
    const { schema, uiSchema } = this.props;
    if (!uiSchema) return uiSchema;

    let optionsUiSchema: UiSchema<T, S, F>[] = [];
    if (ONE_OF_KEY in schema && ONE_OF_KEY in uiSchema) {
      const candidates = (uiSchema as Record<string, unknown>)[ONE_OF_KEY];
      if (Array.isArray(candidates)) {
        optionsUiSchema = candidates as UiSchema<T, S, F>[];
      }
    } else if (ANY_OF_KEY in schema && ANY_OF_KEY in uiSchema) {
      const candidates = (uiSchema as Record<string, unknown>)[ANY_OF_KEY];
      if (Array.isArray(candidates)) {
        optionsUiSchema = candidates as UiSchema<T, S, F>[];
      }
    }

    if (selectedOption >= 0 && optionsUiSchema.length > selectedOption) {
      return optionsUiSchema[selectedOption];
    }

    return uiSchema;
  }

  private getConstValues(optionUiSchema?: UiSchema<T, S, F>): Record<string, unknown> {
    if (!optionUiSchema || typeof optionUiSchema !== 'object') return {};
    if (Array.isArray(optionUiSchema)) return {};

    const constValues: Record<string, unknown> = {};
    Object.entries(optionUiSchema as Record<string, unknown>).forEach(([key, value]) => {
      if (key.startsWith('ui:')) return;
      if (!value || typeof value !== 'object' || Array.isArray(value)) return;
      const uiOptions = (value as Record<string, unknown>)['ui:options'];
      if (!uiOptions || typeof uiOptions !== 'object') return;
      if (Object.hasOwn(uiOptions, 'const')) {
        constValues[key] = (uiOptions as Record<string, unknown>).const;
      }
    });
    return constValues;
  }

  private getSchemaConstValues(optionSchema?: S): Record<string, unknown> {
    if (!optionSchema || typeof optionSchema !== 'object') return {};
    if (getSchemaType(optionSchema) !== 'object') return {};
    const properties = (optionSchema as { properties?: Record<string, unknown> }).properties;
    if (!properties || typeof properties !== 'object') return {};

    const constValues: Record<string, unknown> = {};
    Object.entries(properties as Record<string, unknown>).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') return;
      if (Object.hasOwn(value as Record<string, unknown>, 'const')) {
        constValues[key] = (value as Record<string, unknown>).const;
      } else if (Object.hasOwn(value as Record<string, unknown>, 'default')) {
        constValues[key] = (value as Record<string, unknown>).default;
      }
    });
    return constValues;
  }

  private applyConstDefaultsIfNeeded() {
    const { formData, onChange, fieldPathId } = this.props;
    const { selectedOption, retrievedOptions } = this.state;
    if (selectedOption < 0) return;
    const optionSchema = retrievedOptions[selectedOption];
    if (!optionSchema || getSchemaType(optionSchema) !== 'object') return;

    const constValues = this.getSchemaConstValues(optionSchema);
    const optionUiSchema = this.getOptionUiSchema(selectedOption);
    const uiConstValues = this.getConstValues(optionUiSchema);
    const constValuesMerged = { ...constValues, ...uiConstValues };
    const constKeys = Object.keys(constValuesMerged);
    if (constKeys.length === 0) return;

    const currentData = (formData && typeof formData === 'object')
      ? (formData as Record<string, unknown>)
      : {};
    let changed = false;
    const nextData: Record<string, unknown> = { ...currentData };

    constKeys.forEach((key) => {
      if (nextData[key] !== constValuesMerged[key]) {
        nextData[key] = constValuesMerged[key];
        changed = true;
      }
    });

    if (changed) {
      onChange(nextData as T, fieldPathId.path, undefined, this.getFieldId());
    }
  }

  constructor(props: FieldProps<T, S, F>) {
    super(props);

    const {
      formData,
      options,
      registry: { schemaUtils },
    } = this.props;

    const safeOptions = Array.isArray(options) ? options : [];
    const retrievedOptions = safeOptions.map((opt: S) => schemaUtils.retrieveSchema(opt, formData));
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

  componentDidMount() {
    this.applyConstDefaultsIfNeeded();
  }

  componentDidUpdate(prevProps: Readonly<FieldProps<T, S, F>>) {
    const { formData, options, fieldPathId } = this.props;
    const { optionDataCache } = this.state;
    let newState: AnyOfFieldState<T, S> = this.state;

    if (formData === prevProps.formData && options === prevProps.options) {
      return;
    }

    // If the set of options changed, refresh retrieved options but keep cache
    const safePrevOptions = Array.isArray(prevProps.options) ? prevProps.options : [];
    const safeOptions = Array.isArray(options) ? options : [];
    if (!deepEquals(safePrevOptions, safeOptions)) {
      const {
        registry: { schemaUtils },
      } = this.props;
      const retrievedOptions = safeOptions.map((opt: S) => schemaUtils.retrieveSchema(opt, formData));

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
    if (!deepEquals(formData, prevProps.formData) && fieldPathId.$id === prevProps.fieldPathId.$id) {
      if (this.suppressAutoMatch) {
        this.suppressAutoMatch = false;
      } else {
        const rematchedOption = this.getMatchingOption(
          newState.selectedOption,
          formData,
          newState.retrievedOptions
        );
        if (rematchedOption !== newState.selectedOption) {
          newState = { ...newState, selectedOption: rematchedOption };
        }
      }
    }

    if (newState !== this.state) {
      this.setState(newState);
    }

    if (formData !== prevProps.formData) {
      this.applyConstDefaultsIfNeeded();
    }

  }

  handleOptionBlur = (id: string, value: unknown) => {
    const { onBlur, formData } = this.props;
    const { selectedOption, optionDataCache } = this.state;
    if (onBlur) {
      onBlur(id, value);
    }
    if (selectedOption < 0) return;
    if (formData === this.lastCachedFormData) return;
    this.lastCachedFormData = formData as T;
    const updatedCache = { ...optionDataCache, [selectedOption]: formData as T };
    if (!deepEquals(updatedCache, optionDataCache)) {
      this.setState({ optionDataCache: updatedCache });
    }
  };

  getMatchingOption(selectedOption: number, formData: T | null | undefined, options: S[]) {
    const {
      schema,
      registry: { schemaUtils, globalUiOptions },
      uiSchema,
    } = this.props;

    const uiOptions = getUiOptions(uiSchema, globalUiOptions);
    const autoSelectFirstOption = (uiOptions as { autoSelectFirstOption?: boolean })?.autoSelectFirstOption === true;

    if (typeof formData === 'undefined') {
      return autoSelectFirstOption ? this.getFirstNonNullOptionIndex(options) : -1;
    }

    if (formData === null) {
      const idx = options.findIndex((opt) => {
        if (!opt) return false;
        const type = getSchemaType(opt);
        const record = opt as Record<string, unknown>;
        return type === 'null' || record.const === null;
      });
      if (idx !== -1) {
        return idx;
      }
    }

    if (formData === 'unknown') {
      const idx = options.findIndex((opt) => {
        const record = opt as Record<string, unknown>;
        return record.const === 'unknown';
      });
      if (idx !== -1) {
        return idx;
      }
    }

    if (formData === 'not applicable') {
      const idx = options.findIndex((opt) => {
        const record = opt as Record<string, unknown>;
        return record.const === 'not applicable';
      });
      if (idx !== -1) {
        return idx;
      }
    }

    // Otherwise, behave exactly like upstream rjsf
    const discriminator = getDiscriminatorFieldFromSchema(schema);
    return schemaUtils.getClosestMatchingOption(
      formData ?? undefined,
      options,
      selectedOption,
      discriminator
    );
  }

  getFirstNonNullOptionIndex(options: S[]) {
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (!opt) continue;
      const type = getSchemaType(opt);
      const record = opt as Record<string, unknown>;
      if (type === 'null' || record.const === null) continue;
      return i;
    }
    return options.length > 0 ? 0 : -1;
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

    const isSpecialValue = (value: unknown) => value === null || value === 'unknown' || value === 'not applicable';
    const isSpecialOption = (schema?: S) => {
      if (!schema) return false;
      const schemaType = getSchemaType(schema);
      if (schemaType === 'null') return true;
      if (Object.hasOwn(schema, 'const')) {
        const constValue = (schema as Record<string, unknown>).const;
        return constValue === 'unknown' || constValue === 'not applicable';
      }
      return false;
    };

    // 2) Determine the starting data for the new option
    let newFormData: T | undefined;

    const newOptionIsSpecial = isSpecialOption(newOptionSchema);

    if (newOptionIsSpecial && newOptionSchema) {
      const schemaType = getSchemaType(newOptionSchema);
      if (schemaType === 'null') {
        newFormData = null as T;
      } else {
        newFormData = (newOptionSchema as Record<string, unknown>).const as T;
      }
    } else if (intOption >= 0 && Object.hasOwn(updatedCache, intOption)) {
      const cachedValue = updatedCache[intOption];
      if (!isSpecialValue(cachedValue)) {
        // Restore previously entered data for this option
        newFormData = cachedValue as T | undefined;
      }
    }

    if (typeof newFormData === 'undefined') {
      // No cached data yet: prepare a clean slate based on your existing sanitize/default rules
      // Start from a cleaned version of the old data
      const sanitized = isSpecialValue(formData)
        ? undefined
        : schemaUtils.sanitizeDataForNewSchema(newOptionSchema, oldOptionSchema, formData);

      if (newOptionSchema) {
        const schemaType = getSchemaType(newOptionSchema);

        if (schemaType === 'object') {
          newFormData = schemaUtils.getDefaultFormState(
            newOptionSchema,
            sanitized,
            'excludeObjectChildren'
          ) as T;
        } else if (schemaType === 'array') {
          newFormData = schemaUtils.getDefaultFormState(
            newOptionSchema,
            sanitized,
            'excludeObjectChildren'
          ) as T;
          if (typeof newFormData === 'undefined') {
            newFormData = [] as T;
          }
        } else if (schemaType === 'null') {
          // If option is "Unknown = null", actually set the value to null
          newFormData = null as T;
        } else {
          // For primitives with const, use that literal; otherwise undefined
          const constValue = (newOptionSchema as Record<string, unknown>).const;
          if (typeof constValue !== 'undefined') {
            newFormData = constValue as T;
          } else if (schemaType === 'string' && typeof sanitized === 'undefined') {
            newFormData = '' as T;
          } else {
            newFormData = undefined;
          }
        }
      } else {
        newFormData = sanitized as T;
      }
    }

    if (newOptionSchema && getSchemaType(newOptionSchema) === 'object') {
      const optionUiSchema = this.getOptionUiSchema(intOption);
      const constValues = this.getConstValues(optionUiSchema);
      if (Object.keys(constValues).length > 0) {
        const baseData = (newFormData && typeof newFormData === 'object')
          ? (newFormData as Record<string, unknown>)
          : {};
        newFormData = { ...baseData, ...constValues } as T;
      }
    }

    if (!newOptionIsSpecial && isSpecialValue(newFormData)) {
      newFormData = undefined;
    }

    // Make the selection sticky for the immediate update
    this.suppressAutoMatch = true;

    this.setState(
      { selectedOption: intOption, optionDataCache: updatedCache },
      () => {
        onChange(newFormData as T, this.props.fieldPathId.path, undefined, this.getFieldId());
      }
    );
  };

  getFieldId() {
    const { fieldPathId, schema } = this.props;
    return `${fieldPathId.$id}${schema.oneOf ? '__oneof_select' : '__anyof_select'}`;
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

    const { widgets, fields, translateString, globalUiOptions } = registry;
    const { SchemaField: SchemaFieldComponent } = fields;
    const { selectedOption, retrievedOptions } = this.state;

    const {
      placeholder,
      autofocus,
      autocomplete,
      title = schema.title,
      ...uiOptions
    } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);

    const selectorWidgetValue = (uiOptions as { selectorWidget?: unknown }).selectorWidget;
    const selectorWidget = typeof selectorWidgetValue === 'string' ? selectorWidgetValue : undefined;
    const widget: string | typeof MultiSchemaRadioWidget = !selectorWidget || selectorWidget === 'radio'
      ? MultiSchemaRadioWidget
      : selectorWidget;

    const Widget = getWidget<T, S, F>({ type: 'number' } as S, widget, widgets);
    const rawErrors = get(errorSchema, ERRORS_KEY, []);
    const fieldErrorSchema = omit(errorSchema, [ERRORS_KEY]);

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

    const baseUiSchema = uiSchema ?? {};
    let optionUiSchema = baseUiSchema;
    if (selectedOption >= 0 && optionsUiSchema.length > selectedOption) {
      optionUiSchema = { ...baseUiSchema, ...optionsUiSchema[selectedOption] } as UiSchema<T, S, F>;
    }

    const translateEnum: TranslatableString = title
      ? TranslatableString.TitleOptionPrefix
      : TranslatableString.OptionPrefix;
    const translateParams = title ? [title] : [];

    const enumOptions = retrievedOptions.map((opt: { title?: string; description?: string }, index: number) => {
      const uiOption = getUiOptions<T, S, F>(optionsUiSchema[index]);
      const uiTitle = uiOption.title ?? opt.title;
      const uiDescription = typeof uiOption.description === 'string'
        ? uiOption.description
        : opt.description;
      return {
        label: uiTitle || translateString(translateEnum, translateParams.concat(String(index + 1))),
        value: index,
        description: uiDescription,
      };
    });

    const optionHasConst = optionSchema && Object.hasOwn(optionSchema, 'const');
    const optionType = optionSchema ? getSchemaType(optionSchema) : undefined;
    const optionRecord = optionSchema as Record<string, unknown> | null;
    const optionConst = optionHasConst ? optionRecord?.const : undefined;
    const optionTitle = typeof optionRecord?.title === 'string'
      ? optionRecord.title
      : undefined;
    const isUnknownOption = optionType === 'null'
      && typeof optionTitle === 'string'
      && optionTitle.trim().toLowerCase() === 'unknown';
    const isUnknownConstOption = optionType === 'string' && optionConst === 'unknown';
    const isNotApplicableOption = optionType === 'string' && optionConst === 'not applicable';
    const optionWidget = isUnknownOption || isUnknownConstOption
      ? 'UnknownWidget'
      : isNotApplicableOption
        ? 'NotApplicableWidget'
        : undefined;

    const baseUiOptions = (baseUiSchema as Record<string, unknown>)['ui:options'];
    const optionUiOptions = (optionUiSchema as Record<string, unknown>)['ui:options'];
    const mergedOptionUiSchema = {
      ...optionUiSchema,
      'ui:options': {
        ...(typeof baseUiOptions === 'object' && baseUiOptions ? baseUiOptions as Record<string, unknown> : {}),
        ...(typeof optionUiOptions === 'object' && optionUiOptions ? optionUiOptions as Record<string, unknown> : {}),
        ...(optionWidget ? { widget: optionWidget } : {}),
        __insideOneOf: !!schema.oneOf,
        __insideAnyOf: !!schema.anyOf,
        label: false,
      },
    };
    const normalizedOptionUiSchema = mergedOptionUiSchema as UiSchema<T, S, F>;

    const shouldRenderOptionSchema = Boolean(
      optionSchema &&
      (!optionHasConst
        || optionType === 'object'
        || optionType === 'array'
        || optionType === 'null'
        || isNotApplicableOption
        || isUnknownConstOption)
    );

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
            options={{ enumOptions, ...uiOptions, inline: true }}
            registry={registry}
            formContext={formContext}
            placeholder={placeholder}
            autocomplete={autocomplete}
            autofocus={autofocus}
            label={title ?? name}
            hideLabel={true}
            readonly={readonly}
          />
        </div>
        {shouldRenderOptionSchema && optionSchema && (
          <HeadingDepthProvider value={{ depthOffset: 1, forceNonTopLevel: true }}>
            <SchemaFieldComponent
              {...this.props}
              schema={optionSchema}
              uiSchema={normalizedOptionUiSchema}
              onBlur={this.handleOptionBlur}
            />
          </HeadingDepthProvider>
        )}
      </div>
    );
  }
}

export default MultiSchemaField;
