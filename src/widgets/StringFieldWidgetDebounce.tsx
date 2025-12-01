import { useState, useEffect, useRef, useCallback } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { Input } from 'antd';

export default function StringFieldFastWidget(props: WidgetProps) {
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
  const debouncems = typeof (options as any)?.debouncems === 'number' ? (options as any).debouncems : 180;

  const [local, setLocal] = useState<string>(value ?? '');

  // Track last value we actually sent upstream
  const lastSentRef = useRef<string>(value ?? '');
  const debounceRef = useRef<number | null>(null);

  const send = useCallback(
    (v: string) => {
      const normalized = v === '' ? (options as any)?.emptyValue : v;
      if (normalized !== lastSentRef.current) {
        lastSentRef.current = normalized as string;
        onChange(normalized);
      }
    },
    [onChange, options]
  );

  const schedule = useCallback(
    (v: string) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => send(v), debouncems);
    },
    [send, debouncems]
  );

  // External sync: if parent changes value programmatically, reflect it locally
  useEffect(() => {
    const incoming = value ?? '';
    if (incoming !== local) setLocal(incoming);
    // Keep lastSent aligned when parent forces a new value
    if (incoming !== lastSentRef.current) lastSentRef.current = incoming;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    send(local);        // final flush
    onBlur?.(id, local);
  };

  const handleFocus = () => onFocus?.(id, local);

  return (
    <Input
      id={id}
      value={local}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder={placeholder ?? (options as any)?.placeholder}
      status={rawErrors && rawErrors.length > 0 ? 'error' : ''}
      style={{ width: '100%' }}
    />
  );
}
