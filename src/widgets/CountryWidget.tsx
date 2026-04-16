import { useState, useEffect } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { Loader, Select } from '@mantine/core';

type Option = { label: string; value: string };

const COUNTRIES_FILE = 'data/iso-3166-country-name-and-code-list-alpha-2.json';

let cache: Option[] | null = null;

async function loadCountries(): Promise<Option[]> {
  if (cache) return cache;

  const res = await fetch(COUNTRIES_FILE);
  if (!res.ok) throw new Error(`Failed to load countries: ${res.status}`);

  const data = await res.json();
  cache = data;
  return data;
}

export default function CountryWidget(props: WidgetProps) {
  const {
    id,
    value,
    onChange,
    onFocus,
    onBlur,
    disabled,
    readonly,
    autofocus
  } = props;

  const [opts, setOpts] = useState<Option[]>(() => cache ?? []);
  const [loading, setLoading] = useState(() => !cache);

  useEffect(() => {
    let active = true;

    loadCountries()
      .then(data => active && setOpts(data))
      .catch(() => active && setOpts([]))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, []);

  return (
    <Select
      id={id}
      value={value ?? null}
      searchable
      clearable
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder='Select Country'
      rightSection={loading ? <Loader size="xs" /> : undefined}
      rightSectionPointerEvents="none"
      onChange={(val) => onChange(val ?? undefined)}
      onFocus={() => onFocus?.(id, value)}
      onBlur={() => onBlur?.(id, value)}
      data={opts}
      style={{ width: '100%' }}
    />
  );
}
