export type UmfeFormContext = {
  openExamplesForField?: (key: string) => void;
  openPreviewForField?: (key: string) => void;
  currentFormDataRef?: { current: Record<string, unknown> | null };
  labelVersion?: number;
  fileLabelVersion?: number;
  fieldsCollapsed?: boolean;
  filesCollapsed?: boolean;
  variablesCollapsed?: boolean;
  toggleFieldsCollapsed?: (nextValue?: boolean) => void;
  toggleFilesCollapsed?: (nextValue?: boolean) => void;
  toggleVariablesCollapsed?: (nextValue?: boolean) => void;
  isTabularSchema?: boolean;
  isTabularVcSchema?: boolean;
  tabularPaging?: {
    fields: { enabled: boolean; page: number; total: number };
    variables: { enabled: boolean; page: number; total: number };
  };
  tabularPageSize?: number;
  setTabularPage?: (kind: 'fields' | 'variables', page: number) => void;
  itemCollapseState?: Record<string, boolean>;
  setItemOpenState?: (kind: 'fields' | 'files' | 'variables', index: number, open: boolean) => void;
  removeTabularItem?: (kind: 'fields' | 'variables', index: number) => void;
  showMoveButtons?: boolean;
  markNextFieldOpen?: (index: number) => void;
  collapseInstant?: boolean;
};
