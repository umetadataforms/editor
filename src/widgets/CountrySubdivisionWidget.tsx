// CountrySubdivisionWidget.tsx
/**
 * CountrySubdivisionWidget
 *
 * An RJSF widget for selecting ISO 3166-2 subdivisions.
 * - Reads the current country code from formContext.formDataRef.current
 * - Caches and de-dupes subdivision fetches
 * - Guards against no-op state updates
 * - Keeps UI responsive during option updates
 *
 * NOTE: Exported as a plain function component (no React.memo) because RJSF's
 * getWidget() rejects memoised components (typeof === 'object').
 */

import { useState, useRef, useCallback, useTransition } from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { Select } from 'antd';

type Option = { label: string; value: string };

const SUBDIVS_DIR = 'data/country-subdivisions';

/** In-memory cache for subdivision lists, keyed by country code */
const cache = new Map<string, Option[]>();
/** In-flight requests de-dupe map */
const inflight = new Map<string, Promise<Option[]>>();

async function loadSubdivisions(countryCode: string): Promise<Option[]> {
  if (!countryCode) return [];

  if (cache.has(countryCode)) return cache.get(countryCode)!;
  if (inflight.has(countryCode)) return inflight.get(countryCode)!;

  const promise = (async () => {
    const url = `${SUBDIVS_DIR}/${countryCode}.json`;
    const res = await fetch(url, { method: 'GET' });

    if (!res.ok) {
      throw new Error(`Failed to load ${url}: HTTP ${res.status} ${res.statusText || ''}`.trim());
    }

    const ctype = (res.headers.get('content-type') || '').toLowerCase();
    if (!ctype.includes('application/json')) {
      throw new Error(`It seems the subdivisions JSON file for ${countryCode} was not found.`);
    }

    const data: Option[] = await res.json();
    cache.set(countryCode, data);
    inflight.delete(countryCode);
    return data;
  })();

  inflight.set(countryCode, promise);
  return promise;
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
    formContext,
  } = props;

  const [opts, setOpts] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const lastCountryCodeRef = useRef<string>('');

  /** Parse the array index from id and read the current country code */
  const getCountryCode = useCallback(() => {
    // expects id like: root_geographicCoverage_geographicAreas_0_subdivisionCode
    const parts = id.split('_');
    const idx = Number(parts[3]);
    if (Number.isNaN(idx)) return '';
    const formData = (formContext as any)?.currentFormDataRef?.current as any;
    return formData?.geographicCoverage?.geographicAreas?.[idx]?.countryCode ?? '';
  }, [id, formContext]);

  /** Avoid setState if the options haven't changed */
  const setOptsIfChanged = useCallback((list: Option[]) => {
    setOpts(prev => {
      if (prev.length === list.length && prev.every((p, i) => p.value === list[i].value)) {
        return prev;
      }
      return list;
    });
  }, []);

  /** Fire-and-forget prefetch to make first open feel instant */
  const maybePrefetch = useCallback(() => {
    const cc = getCountryCode();
    if (cc && !cache.has(cc) && !inflight.has(cc)) {
      loadSubdivisions(cc).catch(() => {});
    }
  }, [getCountryCode]);

  /** Update dropdown options for the current country */
  const updateOpts = useCallback(() => {
    const countryCode = getCountryCode();

    // No country selected → clear options & value only if needed
    if (!countryCode) {
      if (opts.length) setOpts([]);
      if (value !== undefined) onChange(undefined);
      lastCountryCodeRef.current = '';
      return;
    }

    // Already loaded for this country and have options → skip
    if (lastCountryCodeRef.current === countryCode && opts.length) return;

    setLoading(true);

    loadSubdivisions(countryCode)
      .then(list => {
        startTransition(() => {
          setOptsIfChanged(list);
          // Clear if current value isn't valid for the new list
          if (value && !list.some(o => o.value === value)) onChange(undefined);
          lastCountryCodeRef.current = countryCode;
        });
      })
      .catch(err => {
        console.error(err);
        if (opts.length) setOpts([]);
        if (value !== undefined) onChange(undefined);
        lastCountryCodeRef.current = '';
      })
      .finally(() => setLoading(false));
  }, [getCountryCode, opts.length, setOptsIfChanged, value, onChange]);

  return (
    <Select
      id={id}
      value={value ?? undefined}
      showSearch
      allowClear
      virtual
      listHeight={256}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder="Pick subdivision"
      loading={loading || isPending}
      options={opts}
      optionFilterProp="label"
      filterOption={true}
      onChange={(val) => onChange(val ?? undefined)}
      onFocus={() => {
        maybePrefetch();
        onFocus?.(id, value);
      }}
      onBlur={() => onBlur?.(id, value)}
      onOpenChange={(open) => {
        if (open) updateOpts();
      }}
      style={{ width: '100%' }}
    />
  );
}
