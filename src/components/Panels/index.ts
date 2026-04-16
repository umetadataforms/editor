/**
 * Public exports for the Panels subsystem.
 */
export {
  PanelsProvider,
  usePanels,
} from './Panels';

export type {
  PanelInstance,
  PanelPayload,
  PanelType,
  PanelRenderer,
  PanelHeaderAction,
  PanelHeaderActions,
} from './Panels';

export {
  usePreviewStore,
  setPreviewStore,
  useExamplesStore,
  setExamplesStore,
} from './panel-store';

export { createPanelRegistry, usePanelRegistry } from './panel-registry';

export {
  PreviewProvider,
  PreviewWindowContent,
  usePreviewPanel,
  usePreviewRefresh,
  previewRenderer,
  createPreviewHeaderAction,
} from './PreviewPanel';

export {
  ExamplesProvider,
  ExamplesWindowContent,
  useExamplesPanel,
  createExamplesRenderer,
} from './ExamplesPanel';

export {
  DescriptionProvider,
  InfoWindowContent,
  useDescriptionPanel,
  infoRenderer,
} from './DescriptionPanel';

export { default as PanelProviders } from './PanelProviders';
