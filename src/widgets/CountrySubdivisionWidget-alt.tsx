/**
 * CountrySubdivisionSelector.tsx
 *
 * A custom React JSON Schema Form widget for selecting ISO 3166-2 country
 * subdivision codes using Ant Design’s <Select> component.
 *
 * The widget dynamically loads a list of subdivisions from JSON files located
 * in `/data/country-subdivisions/{countryCode}.json` whenever the user selects
 * a country such as 'GB', 'US'.
 *
 * Each JSON file should contain an array of objects for a given country code:
 *   [{"label": "US-CA: California", "value": "US-CA"}, ...]
 *
 * The widget reads the parent country code from the form’s current data, then
 * populates the dropdown list accordingly.
 *
 * ⚠ Note: this implementation depends on the exact form-data path
 * `root_geographicCoverage_geographicAreas_index_countryCode` and therefore
 * assumes a fixed schema structure.
 */

import { useState, useRef } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { Select } from 'antd';

type Option = { label: string; value: string };

const SUBDIVS_DIR = 'data/country-subdivisions';

/** In-memory cache for subdivision lists, keyed by country code */
const cache = new Map<string, Option[]>();

/**
 * Loads a list of subdivisions for a given ISO 3166-1 alpha-2 country code.
 *
 * If the list was previously fetched, returns it from the in-memory cache.
 * Otherwise, loads `{SUBDIVSDIR}/{countryCode}.json` over HTTP.
 *
 * @param countryCode ISO 3166-1 alpha-2 code (e.g., "GB", "US")
 * @returns Promise resolving to an array of { label, value } options.
 */
async function loadSubdivisions(countryCode: string): Promise<Option[]> {
  if (!countryCode) return [];

  if (cache.has(countryCode)) return cache.get(countryCode)!;

  const url = `${SUBDIVS_DIR}/${countryCode}.json`;
  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${res.status} ${res.statusText || ''}`.trim());
  }

  const ctype = (res.headers.get('content-type') || '').toLowerCase();
  if (!ctype.includes('application/json')) {
    throw new Error(`It seems the subdivisions JSON file for ${countryCode} was not found.`);
  }

  let data: Option[];
  try {
    data = await res.json();
  } catch (e: any) {
    throw new Error(`Malformed JSON in ${countryCode}.json.`);
  }

  cache.set(countryCode, data);
  return data;
}

export default function CountrySubdivisionWidget(props: WidgetProps) {
  const {
    id,
    value,
    onChange,
    onFocus,
    onBlur,
    disabled,
    readonly,
    autofocus,
    formContext
  } = props;

  const [opts, setOpts] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const lastCountryCodeRef = useRef<string>('');


  /**
   * Determines the ISO 3166-1 alpha-2 country code for the current row.
   *
   * The widget’s `id` encodes its position in `geographicAreas`; this function uses
   * that index to read the corresponding `countryCode` from the latest form data.
   * For example, `id`=`root_geographicCoverage_geographicAreas_0_countryCode`.
   *
   * If the index cannot be derived, or the form does not contain a country code
   * at that location, an empty string is returned.
   *
   * @returns The country code for this row (e.g. "US", "GB") or an empty string.
   */
  const getCountryCode = () => {
    const parts = props.id.split('_');
    const idx = Number(parts[3]);
    if (Number.isNaN(idx)) return '';
    const formData = formContext?.formDataRef?.current;
    const countryCode = formData?.geographicCoverage?.geographicAreas?.[idx]?.countryCode ?? '';
    return countryCode;
  };


  /**
   * Updates the subdivision options for the currently selected country.
   *
   * When invoked, this function reads the latest country code from form data and:
   *  - Clears the subdivision list (and any selected value) if no country is set.
   *  - Skips reloading if the subdivisions for the same country are already cached.
   *  - Otherwise, fetches the subdivision list, updates the dropdown options,
   *    and clears the value if it is invalid for the new list.
   *  - Handles fetch errors gracefully by clearing options and logging the error.
   *
   * This function is called on dropdown open to ensure subdivisions reflect
   * the current country without re-render polling.
   */
  const updateOpts = () => {
    const countryCode = getCountryCode();

    if (!countryCode) {
      setOpts([]);
      if (value) onChange(undefined);
      return;
    }
    if (lastCountryCodeRef.current === countryCode && opts.length) return;

    setLoading(true);

    loadSubdivisions(countryCode)
      .then(list => {
        setOpts(list);
        // Clear if current value isn’t valid for the new list
        if (value && !list.some(o => o.value === value)) onChange(undefined);
        lastCountryCodeRef.current = countryCode;
      })
      .catch((err) => {
        console.error(err);
        setOpts([]);
        onChange(undefined);
      })
      .finally(() => setLoading(false));
  }

  return (
    <Select
      id={id}
      value={value ?? undefined}
      showSearch
      allowClear
      virtual
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder="Pick subdivision"
      loading={loading}
      onChange={(val) => onChange(val ?? undefined)}
      onFocus={() => onFocus?.(id, value)}
      onBlur={() => onBlur?.(id, value)}
      options={opts}
      optionFilterProp='label'
      onOpenChange={(open) => {
        if (!open) return;
        updateOpts();
      }}
      style={{ width: '100%' }}
    />
  );
}
