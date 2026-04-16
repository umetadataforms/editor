/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { customizeValidator } from '@rjsf/validator-ajv8';
import type { RJSFSchema } from '@rjsf/utils';
import { Select, Stack, Text } from '@mantine/core';
import FieldViewer from '../FieldViewer';
import { schemaToNavigationItems } from '../../utils/navigation-items';
import type { SchemaKey } from '../../registries/schema-registry';
import type { Example } from '../../registries/example-registry';
import type { PanelInstance } from './Panels';
import { usePanels } from './Panels';
import { setExamplesStore, useExamplesStore } from './panel-store';
import EXAMPLESREG from '../../registries/example-registry';

const validator = customizeValidator({
  ajvOptionsOverrides: {
    allErrors: false,
    validateFormats: false,
    strict: false,
    inlineRefs: true,
    meta: false,
    code: { optimize: 0 },
  },
});


export type ExamplesContextValue = {
  openExamplesForField: (fieldKey: string) => void;
  closeExamples: () => void;
};

const ExamplesContext = createContext<ExamplesContextValue | null>(null);

/** Access examples panel controls from context. */
export function useExamplesPanel(): ExamplesContextValue {
  const ctx = useContext(ExamplesContext);
  if (!ctx) throw new Error('useExamplesPanel must be used within ExamplesProvider');
  return ctx;
}

/** Provides examples panel context and keeps the examples store in sync. */
export function ExamplesProvider({
  children,
  schema,
  selectedSchemaKey,
}: {
  children: ReactNode;
  schema: RJSFSchema;
  selectedSchemaKey: SchemaKey;
}) {
  const navItems = useMemo(
    () => schemaToNavigationItems(schema),
    [schema]
  );

  const navKeySet = useMemo(() => new Set(navItems.map((n) => n.key)), [navItems]);

  const normaliseKey = useCallback(
    (raw: string) => {
      let s = (raw || '').trim();
      s = s.replace(/^#/, '').replace(/^anchor_/, '');
      const rjsf = s.match(/^root_([^_]+)/);
      if (rjsf) {
        const top = rjsf[1];
        if (navKeySet.has(top)) return top;
      }
      s = s.replace(/^root_/, '');
      if (navKeySet.has(s)) return s;
      return s;
    },
    [navKeySet]
  );

  const {
    panels,
    openPanel,
    closePanel,
    closePanelsByType,
    updatePanel,
    bringToFront,
  } = usePanels();

  const openExamplesForField = useCallback(
    (incomingKey: string) => {
      const key = normaliseKey(incomingKey);
      const fieldTitle = navItems.find((n) => n.key === key)?.title ?? key;
      const title = `Examples: ${fieldTitle}`;

      const openPanels = panels.filter((panel) => panel.type === 'examples' && panel.open);
      const matchingOpen = openPanels.find((panel) => {
        const payload = panel.payload as { fieldKey?: string } | undefined;
        return payload?.fieldKey === key;
      });

      if (matchingOpen) {
        openPanels.forEach((panel) => closePanel(panel.id));
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
        return;
      }

      const closedPanelMatch = panels
        .filter((panel) => panel.type === 'examples')
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      if (closedPanelMatch) {
        reusePanel(closedPanelMatch);
        return;
      }

      openPanel('examples', {
        title,
        payload: { fieldKey: key },
      });
    },
    [normaliseKey, navItems, panels, closePanel, openPanel, updatePanel, bringToFront]
  );

  const closeExamples = useCallback(() => closePanelsByType('examples'), [closePanelsByType]);

  useEffect(() => {
    closePanelsByType('examples');
    setExamplesStore({ schema, selectedSchemaKey });
  }, [selectedSchemaKey, schema, closePanelsByType]);

  const value: ExamplesContextValue = useMemo(
    () => ({
      openExamplesForField,
      closeExamples,
    }),
    [openExamplesForField, closeExamples]
  );

  return (
    <ExamplesContext.Provider value={value}>
      {children}
    </ExamplesContext.Provider>
  );
}

/** Renders the examples panel body for a selected field. */
export function ExamplesWindowContent({ panel }: { panel: PanelInstance }) {
  const { schema, selectedSchemaKey } = useExamplesStore();
  const payload = panel.payload as { fieldKey?: string } | undefined;
  const fieldKey = payload?.fieldKey;

  const schemaKey = selectedSchemaKey ?? '';

  const examples: Example[] = useMemo(
    () => (EXAMPLESREG as Record<string, Example[]>)[schemaKey] ?? [],
    [schemaKey]
  );

  const [examplePick, setExamplePick] = useState<string>(
    () => examples[0]?.key ?? ''
  );

  const exampleOptions = useMemo(
    () => examples.map((e) => ({ label: e.label, value: e.key })),
    [examples]
  );

  const current = useMemo(
    () => examples.find((e) => e.key === examplePick) ?? null,
    [examples, examplePick]
  );

  const displayedData = useMemo(() => {
    if (!current) return null;
    if (!fieldKey || fieldKey === 'root') return current.data;
    const section = (current.data as Record<string, unknown> | undefined)?.[fieldKey];
    return section === undefined ? null : section;
  }, [current, fieldKey]);

  return (
    <Stack gap="md" style={{ width: '100%' }}>
      <div>
        <Text c="dimmed" size="sm">Pick an example file:</Text>
        <Select
          data={exampleOptions}
          value={examplePick || null}
          onChange={(value) => setExamplePick(value ?? '')}
          placeholder="Select an example"
          comboboxProps={{ withinPortal: true, zIndex: 1100 }}
          style={{ width: '100%', marginTop: 8 }}
        />
      </div>

      <FieldViewer
        fieldKey={fieldKey && fieldKey !== 'root' ? fieldKey : 'root'}
        value={displayedData}
        schema={schema}
        ajvValidator={validator}
        rootData={current?.data ?? undefined}
      />
    </Stack>
  );
}

export const createExamplesRenderer = (schemaKey: SchemaKey) => (panel: PanelInstance) => (
  <ExamplesWindowContent key={`${schemaKey}-${panel.id}`} panel={panel} />
);
