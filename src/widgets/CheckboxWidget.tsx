import { useCallback } from 'react';
import type { ChangeEvent, FocusEvent } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, labelValue } from '@rjsf/utils';
import { Checkbox } from '@mantine/core';

/**
 * Checkbox widget without inline description rendering.
 */
export default function CheckboxWidget(props: WidgetProps) {
  const {
    id,
    name,
    htmlName,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    rawErrors,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const handleCheckboxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.checked);
    },
    [onChange]
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      onBlur?.(id, target.checked);
    },
    [onBlur, id]
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      onFocus?.(id, target.checked);
    },
    [onFocus, id]
  );

  return (
    <Checkbox
      id={id}
      name={htmlName || name}
      label={labelValue(label || undefined, hideLabel, false)}
      disabled={disabled || readonly}
      required={required}
      autoFocus={autofocus}
      checked={typeof value === 'undefined' ? false : value === 'true' || value}
      onChange={handleCheckboxChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );
}
