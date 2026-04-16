import { useState, useEffect, useRef, useCallback } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { TextInput } from '@mantine/core';

/**
 * Debounced text input widget for string fields.
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

  // allow per-field override via ui:options.debouncems
  const optionsRecord = options as Record<string, unknown> | undefined;
  const debouncems = typeof optionsRecord?.debouncems === 'number' ? optionsRecord.debouncems : 180;

  const [local, setLocal] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Track last value we actually sent upstream
  const lastSentRef = useRef<unknown>(value);
  const debounceRef = useRef<number | null>(null);

  const send = useCallback(
    (v: string) => {
      const normalized = v === '' ? undefined : v;
      if (!Object.is(normalized, lastSentRef.current)) {
        lastSentRef.current = normalized;
        onChange(normalized as unknown, undefined, id);
      }
    },
    [id, onChange]
  );

  const schedule = useCallback(
    (v: string) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => send(v), debouncems);
    },
    [send, debouncems]
  );

  const displayValue = isEditing
    ? local
    : typeof value === 'string'
      ? value
      : value == null
        ? ''
        : String(value);

  // Cleanup pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocal(v);        // local-only for snappy typing
    schedule(v);        // debounced upstream update
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    send(local);        // final flush
    onBlur?.(id, local);
  };

  const handleFocus = () => {
    setIsEditing(true);
    const next = typeof value === 'string'
      ? value
      : value == null
        ? ''
        : String(value);
    setLocal(next);
    onFocus?.(id, next);
  };

  return (
    <TextInput
      id={id}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder={placeholder ?? (typeof optionsRecord?.placeholder === 'string' ? optionsRecord.placeholder : undefined)}
      error={rawErrors && rawErrors.length > 0 ? 'Invalid value' : undefined}
      style={{ width: '100%' }}
    />
  );
}
