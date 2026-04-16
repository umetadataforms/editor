/**
 * Shared state stores for panels.
 */
import { useSyncExternalStore } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import type { SchemaKey } from '../../registries/schema-registry';

/**
 * Shared preview panel state.
 */
type PreviewStoreState = {
  schema?: RJSFSchema;
  formData?: Record<string, unknown>;
  fieldKey?: string;
};

/**
 * Shared examples panel state.
 */
type ExamplesStoreState = {
  schema?: RJSFSchema;
  selectedSchemaKey?: SchemaKey;
};

let previewState: PreviewStoreState = {};
let examplesState: ExamplesStoreState = {};

const previewListeners = new Set<() => void>();
const examplesListeners = new Set<() => void>();

function notifyPreview() {
  previewListeners.forEach((listener) => listener());
}

function notifyExamples() {
  examplesListeners.forEach((listener) => listener());
}

/** Merge updates into the preview panel store. */
export function setPreviewStore(next: Partial<PreviewStoreState>) {
  previewState = { ...previewState, ...next };
  notifyPreview();
}

/** Merge updates into the examples panel store. */
export function setExamplesStore(next: Partial<ExamplesStoreState>) {
  examplesState = { ...examplesState, ...next };
  notifyExamples();
}

/** Subscribe to the preview panel store state. */
export function usePreviewStore() {
  return useSyncExternalStore(
    (listener) => {
      previewListeners.add(listener);
      return () => previewListeners.delete(listener);
    },
    () => previewState,
    () => previewState
  );
}

/** Subscribe only to the preview field key. */
export function usePreviewFieldKey() {
  return useSyncExternalStore(
    (listener) => {
      previewListeners.add(listener);
      return () => previewListeners.delete(listener);
    },
    () => previewState.fieldKey,
    () => previewState.fieldKey
  );
}

/** Subscribe to the examples panel store state. */
export function useExamplesStore() {
  return useSyncExternalStore(
    (listener) => {
      examplesListeners.add(listener);
      return () => examplesListeners.delete(listener);
    },
    () => examplesState,
    () => examplesState
  );
}
