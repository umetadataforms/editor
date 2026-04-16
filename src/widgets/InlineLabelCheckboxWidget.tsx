import { useCallback } from 'react';

import { Checkbox } from '@mantine/core';
import type { WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds } from '@rjsf/utils';

/** Resolve a human-friendly label from props/schema/name. */
const getLabelText = (props: WidgetProps) => {
  const { label, name, schema } = props;
  const base = typeof label === 'string' && label.trim().length > 0
    ? label.trim()
    : typeof schema?.title === 'string' && schema.title.trim().length > 0
      ? schema.title.trim()
      : name;
  if (!base) return '';
  return base.charAt(0).toUpperCase() + base.slice(1);
};

/**
 * Checkbox widget that renders the label inline with required styling.
 */
export default function InlineLabelCheckboxWidget(props: WidgetProps) {
  const {
    id,
    name,
    htmlName,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    rawErrors,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const labelText = getLabelText(props);
  const labelClassName = required
    ? 'umfe-inline-checkbox-title umfe-field-required'
    : 'umfe-inline-checkbox-title';
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.currentTarget.checked);
    },
    [onChange]
  );

  return (
    <div className="umfe-inline-checkbox">
      <span className={labelClassName}>{labelText}</span>
      <Checkbox
        id={id}
        name={htmlName || name}
        checked={Boolean(value)}
        disabled={disabled || readonly}
        autoFocus={autofocus}
        onChange={handleChange}
        onBlur={(event) => onBlur?.(id, event.currentTarget.checked)}
        onFocus={(event) => onFocus?.(id, event.currentTarget.checked)}
        error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
        aria-describedby={ariaDescribedByIds(id)}
        label={undefined}
      />
    </div>
  );
}
