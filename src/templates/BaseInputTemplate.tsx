import { useCallback } from 'react';
import type { ChangeEvent, FocusEvent, MouseEvent } from 'react';
import type {
  BaseInputTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import {ariaDescribedByIds, getInputProps, labelValue,} from '@rjsf/utils';
import { NumberInput, TextInput } from '@mantine/core';

import { cleanupOptions } from '../utils/options-utils';

/** The `BaseInputTemplate` renders the core text/number inputs.
 *
 * Changes from upstream: uses Mantine inputs and omits description rendering,
 * which is handled by field-level templates.
 *
 * @param props - The `BaseInputTemplateProps` for this template
 */
export default function BaseInputTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    htmlName,
    type,
    schema,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    options,
    rawErrors,
    children,
    registry,
  } = props;

  const { ClearButton } = registry.templates.ButtonTemplates;
  const inputProps = getInputProps<T, S, F>(schema, type, options, false);
  const themeProps = cleanupOptions(options);

  const handleNumberChange = useCallback(
    (nextValue: number | string) => {
      (onChange as (value: unknown) => void)(nextValue);
    },
    [onChange]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const handler = (onChangeOverride ?? onChange) as (value: unknown) => void;
      const nextValue = e.target.value === '' ? options?.emptyValue : e.target.value;
      handler(nextValue);
    },
    [onChange, onChangeOverride, options]
  );

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      onBlur(id, e.target && e.target.value);
    },
    [onBlur, id]
  );

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      onFocus(id, e.target && e.target.value);
    },
    [onFocus, id]
  );

  const handleClear = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(options?.emptyValue ?? '');
    },
    [onChange, options]
  );

  const componentProps = {
    id,
    name: htmlName || id,
    label: labelValue(label || undefined, hideLabel, false),
    required,
    autoFocus: autofocus,
    disabled: disabled || readonly,
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
    placeholder,
    error: rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined,
  };

  const input =
    inputProps.type === 'number' || inputProps.type === 'integer' ? (
      <NumberInput
        onChange={!readonly ? handleNumberChange : undefined}
        {...componentProps}
        {...inputProps}
        {...themeProps}
        step={typeof inputProps.step === 'number' ? inputProps.step : 1}
        type='text'
        value={value ?? undefined}
        aria-describedby={ariaDescribedByIds(id, false)}
      />
    ) : (
      <TextInput
        onChange={!readonly ? handleChange : undefined}
        {...componentProps}
        {...inputProps}
        {...themeProps}
        value={value ?? undefined}
        aria-describedby={ariaDescribedByIds(id, false)}
      />
    );

  return (
    <>
      {input}
      {options?.allowClearTextInputs && !readonly && !disabled && value && (
        <ClearButton registry={registry} onClick={handleClear} />
      )}
      {children}
    </>
  );
}
