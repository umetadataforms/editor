import { useCallback, useState } from 'react';

import { isTabularSchemaId, isTabularVcSchemaId } from '../utils/tabular-schema-ids';

type CollapseItemKind = 'fields' | 'files' | 'variables';

type UseCollapsibleItemsOptions = {
  schemaId?: string;
};

/**
 * Manages collapsible list state for fields/files/variables.
 */
export default function useCollapsibleItems({
  schemaId,
}: UseCollapsibleItemsOptions) {
  const isTabularSchema = isTabularSchemaId(schemaId);
  const isTabularVcSchema = isTabularVcSchemaId(schemaId);
  const canCollapseItems = isTabularSchema || isTabularVcSchema;

  const [fieldsCollapsed, setFieldsCollapsed] = useState(canCollapseItems);
  const [fieldsCollapseVersion, setFieldsCollapseVersion] = useState(0);
  const [filesCollapsed, setFilesCollapsed] = useState(canCollapseItems);
  const [filesCollapseVersion, setFilesCollapseVersion] = useState(0);
  const [variablesCollapsed, setVariablesCollapsed] = useState(isTabularVcSchema);
  const [variablesCollapseVersion, setVariablesCollapseVersion] = useState(0);
  const [showMoveButtons, setShowMoveButtons] = useState(false);
  const [itemCollapseState, setItemCollapseState] = useState<Record<string, boolean>>({});

  const makeItemKey = useCallback(
    (kind: CollapseItemKind, index: number) => `${kind}.${index}`,
    []
  );

  const setItemOpenState = useCallback(
    (kind: CollapseItemKind, index: number, open: boolean) => {
      setItemCollapseState((current) => {
        const key = makeItemKey(kind, index);
        if (current[key] === open) return current;
        return { ...current, [key]: open };
      });
    },
    [makeItemKey]
  );

  const clearItemOpenStateForKind = useCallback((kind: CollapseItemKind) => {
    setItemCollapseState((current) => {
      const prefix = `${kind}.`;
      let didChange = false;
      const next: Record<string, boolean> = {};
      Object.entries(current).forEach(([key, value]) => {
        if (key.startsWith(prefix)) {
          didChange = true;
          return;
        }
        next[key] = value;
      });
      return didChange ? next : current;
    });
  }, []);

  const toggleFieldsCollapsed = useCallback((nextValue?: boolean) => {
    setFieldsCollapsed((current) => (typeof nextValue === 'boolean' ? nextValue : !current));
    setFieldsCollapseVersion((current) => current + 1);
    clearItemOpenStateForKind('fields');
  }, [clearItemOpenStateForKind]);

  const toggleFilesCollapsed = useCallback((nextValue?: boolean) => {
    setFilesCollapsed((current) => (typeof nextValue === 'boolean' ? nextValue : !current));
    setFilesCollapseVersion((current) => current + 1);
    clearItemOpenStateForKind('files');
  }, [clearItemOpenStateForKind]);

  const toggleVariablesCollapsed = useCallback((nextValue?: boolean) => {
    setVariablesCollapsed((current) => (typeof nextValue === 'boolean' ? nextValue : !current));
    setVariablesCollapseVersion((current) => current + 1);
    clearItemOpenStateForKind('variables');
  }, [clearItemOpenStateForKind]);

  const markNextFieldOpen = useCallback((index: number) => {
    setItemOpenState('fields', index, true);
  }, [setItemOpenState]);

  const requestCollapseItem = useCallback(
    (kind: CollapseItemKind, index: number, action: 'collapse' | 'expand') => {
      setItemOpenState(kind, index, action === 'expand');
    },
    [setItemOpenState]
  );

  return {
    canCollapseItems,
    isTabularSchema,
    isTabularVcSchema,
    fieldsCollapsed,
    fieldsCollapseVersion,
    filesCollapsed,
    filesCollapseVersion,
    variablesCollapsed,
    variablesCollapseVersion,
    toggleFieldsCollapsed,
    toggleFilesCollapsed,
    toggleVariablesCollapsed,
    showMoveButtons,
    setShowMoveButtons,
    itemCollapseState,
    setItemOpenState,
    markNextFieldOpen,
    requestCollapseItem,
  };
}
