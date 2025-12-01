import { useState, useEffect, useCallback } from 'react';
import { Input } from 'antd';
import type { WidgetProps } from '@rjsf/utils';

/**
 * A lightweight single-line AntD string widget.
 * Mirrors the default @rjsf/antd StringWidget, but avoids lag by buffering typing.
 */
export default function StringFieldWidget(props: WidgetProps) {
  const {
    id,
    value,
    onChange,
    onBlur,
    onFocus,
    disabled,
    readonly,
    autofocus,
    placeholder,
    options,
    rawErrors,
  } = props;

  const [local, setLocal] = useState(value ?? '');

  // Optional: sync if parent resets/updates the value
  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  const commit = useCallback(
    (v: string) => onChange(v === '' ? options?.emptyValue : v),
    [onChange, options?.emptyValue]
  );

  return (
    <Input
      id={id}
      value={local}
      onChange={(e) => setLocal(e.target.value)}       // local typing only
      onBlur={() => { commit(local); onBlur?.(id, local); }}
      onFocus={() => onFocus?.(id, local)}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder={placeholder}
      status={rawErrors && rawErrors.length > 0 ? 'error' : ''}
      style={{ width: '100%' }}
    />
  );
}
