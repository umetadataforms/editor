import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { FormData } from '../components/FormShell';

export type TabularPaging = {
  fields: { enabled: boolean; page: number; total: number };
  variables: { enabled: boolean; page: number; total: number };
};

type UseTabularPagingOptions = {
  initialFormData: FormData | null;
  isTabularSchema: boolean;
  isTabularVcSchema: boolean;
  formDataRef: { current: FormData | null };
  pagingThreshold: number;
  pageSize: number;
};

type UseTabularPagingResult = {
  formData: FormData;
  setFormData: (next: FormData) => void;
  fullFormDataRef: { current: FormData };
  tabularPaging: TabularPaging;
  tabularPageSize: number;
  setTabularPage: (kind: 'fields' | 'variables', nextPage: number) => void;
  buildPagedFormData: (base: FormData, paging: TabularPaging) => FormData;
  mergePagedData: (nextData: FormData) => FormData;
  ensurePagingEnabled: (kind: 'fields' | 'variables') => boolean;
  removeItem: (kind: 'fields' | 'variables', index: number) => FormData;
  moveItem: (kind: 'fields' | 'variables', fromIndex: number, toIndex: number) => void;
};

/**
 * Manages paging state and merges full tabular data with the current page.
 */
export default function useTabularPaging({
  initialFormData,
  isTabularSchema,
  isTabularVcSchema,
  formDataRef,
  pagingThreshold,
  pageSize,
}: UseTabularPagingOptions): UseTabularPagingResult {
  const compactPageItems = useCallback(<T,>(items: T[]): T[] => (
    items.filter((item): item is T => typeof item !== 'undefined')
  ), []);

  const initialPaging = useMemo(() => {
    const baseData = initialFormData ?? {};
    let data = baseData;
    let fullData = baseData;
    const paging: TabularPaging = {
      fields: { enabled: false, page: 0, total: 0 },
      variables: { enabled: false, page: 0, total: 0 },
    };

    if (isTabularSchema && Array.isArray((baseData as { fields?: unknown }).fields)) {
      const fields = (baseData as { fields?: Array<Record<string, unknown>> }).fields ?? [];
      paging.fields.total = fields.length;
      if (fields.length > pagingThreshold) {
        paging.fields.enabled = true;
        data = { ...data, fields: fields.slice(0, pageSize) };
        fullData = { ...fullData, fields };
      }
    }

    if (isTabularVcSchema && Array.isArray((baseData as { variables?: unknown }).variables)) {
      const variables = (baseData as { variables?: Array<Record<string, unknown>> }).variables ?? [];
      paging.variables.total = variables.length;
      if (variables.length > pagingThreshold) {
        paging.variables.enabled = true;
        data = { ...data, variables: variables.slice(0, pageSize) };
        fullData = { ...fullData, variables };
      }
    }

    return { data, fullData, paging };
  }, [initialFormData, isTabularSchema, isTabularVcSchema, pagingThreshold, pageSize]);

  const [formData, setFormData] = useState<FormData>(() => initialPaging.data as FormData);
  const fullFormDataRef = useRef<FormData>(initialPaging.fullData as FormData);
  const [tabularPaging, setTabularPaging] = useState<TabularPaging>(() => initialPaging.paging);
  const tabularPagingRef = useRef(tabularPaging);

  useEffect(() => {
    tabularPagingRef.current = tabularPaging;
  }, [tabularPaging]);

  useEffect(() => {
    formDataRef.current = fullFormDataRef.current;
  }, [formData, formDataRef]);

  const buildPagedFormData = useCallback((base: FormData, paging: TabularPaging) => {
    if (!paging.fields.enabled && !paging.variables.enabled) return base;
    let next: FormData = { ...base };

    if (paging.fields.enabled) {
      const fullFields = Array.isArray(base.fields) ? base.fields : [];
      const start = paging.fields.page * pageSize;
      next = { ...next, fields: fullFields.slice(start, start + pageSize) };
    }

    if (paging.variables.enabled) {
      const fullVariables = Array.isArray(base.variables) ? base.variables : [];
      const start = paging.variables.page * pageSize;
      next = { ...next, variables: fullVariables.slice(start, start + pageSize) };
    }

    return next;
  }, [pageSize]);

  const updateTabularTotal = useCallback((kind: 'fields' | 'variables', total: number) => {
    setTabularPaging((prev) => {
      if (kind === 'fields') {
        if (prev.fields.total === total) return prev;
        return { ...prev, fields: { ...prev.fields, total } };
      }
      if (prev.variables.total === total) return prev;
      return { ...prev, variables: { ...prev.variables, total } };
    });
  }, []);

  const setTabularPage = useCallback((kind: 'fields' | 'variables', nextPage: number) => {
    const full = fullFormDataRef.current;
    const fullItems = Array.isArray((full as Record<string, unknown>)[kind])
      ? ((full as Record<string, unknown>)[kind] as Array<Record<string, unknown>>)
      : [];
    const total = fullItems.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.max(0, Math.min(nextPage, pageCount - 1));

    const currentPaging = tabularPagingRef.current;
    const nextPaging: TabularPaging = kind === 'fields'
      ? { ...currentPaging, fields: { ...currentPaging.fields, page, total } }
      : { ...currentPaging, variables: { ...currentPaging.variables, page, total } };

    setTabularPaging(nextPaging);
    setFormData(buildPagedFormData(fullFormDataRef.current, nextPaging));
  }, [pageSize, buildPagedFormData, setFormData]);

  const mergePagedData = useCallback((nextData: FormData) => {
    let updated: FormData = { ...fullFormDataRef.current, ...nextData };
    const paging = tabularPagingRef.current;

    if (paging.fields.enabled) {
      const fullFields = Array.isArray(fullFormDataRef.current.fields)
        ? fullFormDataRef.current.fields
        : [];
      const pageItemsRaw = Array.isArray(nextData.fields) ? nextData.fields : [];
      const pageItems = compactPageItems(pageItemsRaw);
      const start = paging.fields.page * pageSize;
      const merged = fullFields.slice();
      const oldPage = fullFields.slice(start, start + pageSize);
      const overflow = pageItems.length > pageSize ? pageItems.slice(pageSize) : [];
      const pageSlice = pageItems.length > pageSize ? pageItems.slice(0, pageSize) : pageItems;

      if (pageSlice.length < oldPage.length) {
        let removeOffset = pageSlice.length;
        const compareCount = Math.min(pageSlice.length, oldPage.length);
        for (let i = 0; i < compareCount; i += 1) {
          if (oldPage[i] !== pageSlice[i]) {
            removeOffset = i;
            break;
          }
        }
        merged.splice(start + removeOffset, 1);
        pageSlice.forEach((item, index) => {
          merged[start + index] = item;
        });
      } else {
        const range = Math.max(0, Math.min(pageSize, fullFields.length - start));
        merged.splice(start, range, ...pageSlice);
      }

      if (overflow.length > 0) {
        merged.push(...overflow);
      }
      updated = { ...updated, fields: merged };
      if (merged.length !== paging.fields.total) {
        updateTabularTotal('fields', merged.length);
      }
    }

    if (paging.variables.enabled) {
      const fullVariables = Array.isArray(fullFormDataRef.current.variables)
        ? fullFormDataRef.current.variables
        : [];
      const pageItemsRaw = Array.isArray(nextData.variables) ? nextData.variables : [];
      const pageItems = compactPageItems(pageItemsRaw);
      const start = paging.variables.page * pageSize;
      const merged = fullVariables.slice();
      const overflow = pageItems.length > pageSize ? pageItems.slice(pageSize) : [];
      const pageSlice = pageItems.length > pageSize ? pageItems.slice(0, pageSize) : pageItems;

      const oldPage = fullVariables.slice(start, start + pageSize);
      if (pageSlice.length < oldPage.length) {
        let removeOffset = pageSlice.length;
        const compareCount = Math.min(pageSlice.length, oldPage.length);
        for (let i = 0; i < compareCount; i += 1) {
          if (oldPage[i] !== pageSlice[i]) {
            removeOffset = i;
            break;
          }
        }
        merged.splice(start + removeOffset, 1);
        pageSlice.forEach((item, index) => {
          merged[start + index] = item;
        });
      } else {
        const range = Math.max(0, Math.min(pageSize, fullVariables.length - start));
        merged.splice(start, range, ...pageSlice);
      }

      if (overflow.length > 0) {
        merged.push(...overflow);
      }
      updated = { ...updated, variables: merged };
      if (merged.length !== paging.variables.total) {
        updateTabularTotal('variables', merged.length);
      }
    }

    fullFormDataRef.current = updated;
    formDataRef.current = updated;
    return updated;
  }, [compactPageItems, formDataRef, pageSize, updateTabularTotal]);

  const ensurePagingEnabled = useCallback((kind: 'fields' | 'variables') => {
    const paging = tabularPagingRef.current;
    const currentState = kind === 'fields' ? paging.fields : paging.variables;
    if (currentState.enabled) return false;

    const full = fullFormDataRef.current;
    const fullItems = Array.isArray((full as Record<string, unknown>)[kind])
      ? ((full as Record<string, unknown>)[kind] as Array<Record<string, unknown>>)
      : [];
    if (fullItems.length <= pagingThreshold) return false;

    const pageCount = Math.max(1, Math.ceil(fullItems.length / pageSize));
    const page = Math.max(0, pageCount - 1);
    const nextPaging: TabularPaging = kind === 'fields'
      ? { ...paging, fields: { enabled: true, page, total: fullItems.length } }
      : { ...paging, variables: { enabled: true, page, total: fullItems.length } };

    setTabularPaging(nextPaging);
    setFormData(buildPagedFormData(fullFormDataRef.current, nextPaging));
    return true;
  }, [pagingThreshold, pageSize, buildPagedFormData, setFormData]);

  const removeItem = useCallback((kind: 'fields' | 'variables', index: number) => {
    const full = fullFormDataRef.current;
    const list = Array.isArray((full as Record<string, unknown>)[kind])
      ? ((full as Record<string, unknown>)[kind] as Array<Record<string, unknown>>)
      : [];
    if (index < 0 || index >= list.length) return full;

    const nextList = list.slice();
    nextList.splice(index, 1);

    const updated = { ...full, [kind]: nextList } as FormData;
    fullFormDataRef.current = updated;
    formDataRef.current = updated;

    const paging = tabularPagingRef.current;
    const pagingState = kind === 'fields' ? paging.fields : paging.variables;
    if (pagingState.enabled) {
      const nextTotal = nextList.length;
      const pageCount = Math.max(1, Math.ceil(nextTotal / pageSize));
      const nextPage = Math.max(0, Math.min(pagingState.page, pageCount - 1));
      const nextPaging: TabularPaging = kind === 'fields'
        ? { ...paging, fields: { ...paging.fields, page: nextPage, total: nextTotal } }
        : { ...paging, variables: { ...paging.variables, page: nextPage, total: nextTotal } };
      setTabularPaging(nextPaging);
      setFormData(buildPagedFormData(updated, nextPaging));
      return updated;
    }

    setFormData(updated);
    return updated;
  }, [buildPagedFormData, formDataRef, pageSize, setFormData]);

  const moveItem = useCallback((kind: 'fields' | 'variables', fromIndex: number, toIndex: number) => {
    const full = fullFormDataRef.current;
    const list = Array.isArray((full as Record<string, unknown>)[kind])
      ? ((full as Record<string, unknown>)[kind] as Array<Record<string, unknown>>)
      : [];
    if (fromIndex < 0 || fromIndex >= list.length) return;
    const clampedTo = Math.max(0, Math.min(toIndex, list.length - 1));
    if (fromIndex === clampedTo) return;

    const nextList = list.slice();
    const [moved] = nextList.splice(fromIndex, 1);
    nextList.splice(clampedTo, 0, moved);

    const updated = { ...full, [kind]: nextList } as FormData;
    fullFormDataRef.current = updated;
    formDataRef.current = updated;

    const paging = tabularPagingRef.current;
    const pagingEnabled = kind === 'fields' ? paging.fields.enabled : paging.variables.enabled;
    if (pagingEnabled) {
      const page = Math.max(0, Math.floor(clampedTo / pageSize));
      setTabularPage(kind, page);
      return;
    }

    setFormData(updated);
  }, [formDataRef, pageSize, setFormData, setTabularPage]);

  return {
    formData,
    setFormData,
    fullFormDataRef,
    tabularPaging,
    tabularPageSize: pageSize,
    setTabularPage,
    buildPagedFormData,
    mergePagedData,
    ensurePagingEnabled,
    removeItem,
    moveItem,
  };
}
