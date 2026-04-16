/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { customizeValidator } from '@rjsf/validator-ajv8';
import type { RefObject } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { IconRefresh } from '@tabler/icons-react';
import FieldViewer from '../FieldViewer';
import type { PanelHeaderAction, PanelInstance } from './Panels';
import { usePanels } from './Panels';
import { setPreviewStore, usePreviewStore } from './panel-store';

import { schemaToNavigationItems } from '../../utils/navigation-items';

const validator = customizeValidator({
  ajvOptionsOverrides: {
    allErrors: false,
    validateFormats: false,
    strict: false,
    inlineRefs: true,
    meta: false,
    validateSchema: false,
    code: { optimize: 1 },
  },
});

export type PreviewNavItem = { key: string; title: string };

export type PreviewContextValue = {
  openPreviewForField: (fieldKey: string) => void;
  closePreview: () => void;
};

const PreviewContext = createContext<PreviewContextValue | null>(null);

/** Access preview panel controls from context. */
export function usePreviewPanel(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error('usePreviewPanel must be used within PreviewProvider');
  return ctx;
}

/**
 * Creates a refresh handler that syncs the preview store with current form data.
 */
export function usePreviewRefresh(getFormData: () => Record<string, unknown> | undefined) {
  return useCallback(() => {
    setPreviewStore({ formData: getFormData() });
  }, [getFormData]);
}

const normaliseKey = (raw: string, validKeys: Set<string>) => {
  let s = (raw || '').trim();
  s = s.replace(/^#/, '').replace(/^anchor_/, '');
  s = s.replace(/\b(fields|variables|files)\.(\d+)(?=\.|$)/g, '$1[$2]');
  if (s.startsWith('root_')) {
    const rjsfPath = s.slice('root_'.length);
    if (validKeys.has(rjsfPath)) return rjsfPath;

    const topKey = Array.from(validKeys)
      .filter((key) => key !== 'root')
      .sort((a, b) => b.length - a.length)
      .find((key) => rjsfPath === key || rjsfPath.startsWith(`${key}_`));

    if (topKey) return topKey;
  }
  s = s.replace(/^root_/, '');
  if (s.includes('.') || s.includes('[')) return s;
  if (validKeys.has(s)) return s;
  return s;
};

const parsePath = (path: string): string[] => {
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').filter(Boolean);
};

const getValueAtPath = (data: unknown, path: string | null | undefined): unknown => {
  if (!path || path === 'root') return data;
  const parts = parsePath(String(path));
  let node: unknown = data;
  for (const part of parts) {
    if (node == null) return undefined;
    if (Array.isArray(node)) {
      const idx = Number(part);
      if (!Number.isFinite(idx)) return undefined;
      node = node[idx];
      continue;
    }
    if (typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
};

/**
 * Provides preview panel context and keeps the preview store in sync with schema/data.
 */
export function PreviewProvider({
  children,
  schema,
  formDataRef,
}: {
  children: ReactNode;
  schema: RJSFSchema;
  formDataRef?: RefObject<Record<string, unknown> | null>;
}) {
  const navItems = useMemo(
    () => schemaToNavigationItems(schema),
    [schema]
  );

  const navKeySet = useMemo(() => new Set(navItems.map((n) => n.key)), [navItems]);
  const {
    panels,
    openPanel,
    closePanel,
    closePanelsByType,
    updatePanel,
    bringToFront,
  } = usePanels();
  const panelsRef = useRef(panels);

  useEffect(() => {
    panelsRef.current = panels;
  }, [panels]);

  const openPreviewForField = useCallback((incomingKey: string) => {
    const latestPanels = panelsRef.current;
    const key = normaliseKey(incomingKey, navKeySet);
    const fieldTitle = navItems.find((n) => n.key === key)?.title ?? key;
    const title = `Preview: ${fieldTitle}`;

    if (formDataRef?.current) {
      setPreviewStore({ formData: formDataRef.current });
    }

    const openPanels = latestPanels.filter((panel) => panel.type === 'preview' && panel.open);
    const matchingOpen = openPanels.find((panel) => {
      const payload = panel.payload as { fieldKey?: string } | undefined;
      return payload?.fieldKey === key;
    });

    if (matchingOpen) {
      openPanels.forEach((panel) => closePanel(panel.id));
      setPreviewStore({ fieldKey: undefined });
      return;
    }

    const openPanelMatch = openPanels
      .sort((a, b) => b.zIndex - a.zIndex)[0];

    const reusePanel = (panel: PanelInstance) => {
      const restoreSize = panel.minimized ? (panel.expandedSize ?? panel.size) : panel.size;
      updatePanel(panel.id, {
        open: true,
        title,
        payload: { fieldKey: key },
        minimized: false,
        size: restoreSize,
        expandedSize: panel.minimized ? undefined : panel.expandedSize,
      });
      bringToFront(panel.id);
    };

    if (openPanelMatch) {
      openPanels
        .filter((panel) => panel.id !== openPanelMatch.id)
        .forEach((panel) => closePanel(panel.id));
      reusePanel(openPanelMatch);
      setPreviewStore({ fieldKey: key });
      return;
    }

    const closedPanelMatch = latestPanels
      .filter((panel) => panel.type === 'preview')
      .sort((a, b) => b.zIndex - a.zIndex)[0];
    if (closedPanelMatch) {
      reusePanel(closedPanelMatch);
      setPreviewStore({ fieldKey: key });
      return;
    }
    openPanel('preview', {
      title,
      payload: { fieldKey: key },
    });
    setPreviewStore({ fieldKey: key });
  }, [
    navItems,
    navKeySet,
    closePanel,
    openPanel,
    updatePanel,
    bringToFront,
    formDataRef,
  ]);

  const closePreview = useCallback(() => {
    closePanelsByType('preview');
    setPreviewStore({ fieldKey: undefined });
  }, [closePanelsByType]);

  const value: PreviewContextValue = {
    openPreviewForField,
    closePreview,
  };

  useEffect(() => {
    closePanelsByType('preview');
    setPreviewStore({ schema, formData: undefined, fieldKey: undefined });
  }, [schema, closePanelsByType]);

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  );
}

/** Renders the preview panel body for a selected field. */
export function PreviewWindowContent({ panel }: { panel: PanelInstance }) {
  const { schema, formData } = usePreviewStore();
  const payload = panel.payload as { fieldKey?: string } | undefined;
  const fieldKey = payload?.fieldKey;
  const key = fieldKey && fieldKey !== 'root' ? fieldKey : 'root';
  const displayedData = useMemo(() => {
    if (!formData) return null;
    return getValueAtPath(formData, key);
  }, [formData, key]);

  return (
    <FieldViewer
      fieldKey={key}
      value={displayedData ?? null}
      schema={schema}
      ajvValidator={validator}
      rootData={formData ?? undefined}
    />
  );
}

export const previewRenderer = (panel: PanelInstance) => (
  <PreviewWindowContent panel={panel} />
);

export const createPreviewHeaderAction = (onRefresh: () => void): PanelHeaderAction => () => (
  <Tooltip label="Update Preview" withArrow zIndex={1100}>
    <ActionIcon
      size="sm"
      variant="subtle"
      onClick={onRefresh}
      aria-label="Update Preview"
    >
      <IconRefresh size={14} />
    </ActionIcon>
  </Tooltip>
);
