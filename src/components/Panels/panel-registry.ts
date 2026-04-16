/**
 * Registry builder for panel renderers and header actions.
 */
import { useMemo } from 'react';

import type { PanelHeaderActions, PanelRenderer, PanelType } from './Panels';
import type { SchemaKey } from '../../registries/schema-registry';
import { createExamplesRenderer } from './ExamplesPanel';
import { infoRenderer } from './DescriptionPanel';
import { createPreviewHeaderAction, previewRenderer, usePreviewRefresh } from './PreviewPanel';

type PanelRegistryOptions = {
  selectedSchemaKey: SchemaKey;
  onPreviewRefresh: () => void;
};

/**
 * Builds panel renderer and header action maps.
 */
export function createPanelRegistry(
  {
    selectedSchemaKey,
    onPreviewRefresh,
  }: PanelRegistryOptions,
): {
  renderers: Record<PanelType, PanelRenderer>;
  headerActions: PanelHeaderActions;
} {
  const renderers: Record<PanelType, PanelRenderer> = {
    preview: previewRenderer,
    examples: createExamplesRenderer(selectedSchemaKey),
    info: infoRenderer,
  };

  /** Additional per-panel header actions (base header controls always render). */
  const headerActions: PanelHeaderActions = {
    preview: createPreviewHeaderAction(onPreviewRefresh),
  };

  return { renderers, headerActions };
}

type PanelRegistryHookOptions = {
  selectedSchemaKey: SchemaKey;
  getFormData: () => Record<string, unknown> | undefined;
};

/**
 * Builds panel renderers and header actions for the current form state.
 */
export function usePanelRegistry({
  selectedSchemaKey,
  getFormData,
}: PanelRegistryHookOptions) {
  const handlePreviewRefresh = usePreviewRefresh(getFormData);

  return useMemo(
    () => createPanelRegistry({
      selectedSchemaKey,
      onPreviewRefresh: handlePreviewRefresh,
    }),
    [handlePreviewRefresh, selectedSchemaKey]
  );
}
