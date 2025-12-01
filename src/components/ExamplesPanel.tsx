import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { RJSFSchema } from '@rjsf/utils';
import { Select, Typography, Space } from 'antd';
import ResizableDrawer from './ResizableDrawer';
import FieldViewer from './FieldViewer';
import { schemaToNavigationItems } from '../utils/navigation-items';
import { SchemaKey } from '../utils/schema-registry';
import { Example } from '../utils/example-registry';

import EXAMPLESREG from '../utils/example-registry';

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

const { Text } = Typography;

/** Private UI component rendered by the provider */
function ExamplePanelUI({
  open,
  onClose,
  fieldKey,
  fieldTitle,
  schema,
  selectedSchemaKey
}: {
  open: boolean;
  onClose: () => void;
  fieldKey: string | null;
  fieldTitle: string;
  schema?: RJSFSchema;
  selectedSchemaKey: SchemaKey;
}) {

  const examples: Example[] = useMemo(
    () => (EXAMPLESREG as Record<string, Example[]>)[selectedSchemaKey] ?? [],
    [selectedSchemaKey]
  );

  const [examplePick, setExamplePick] = useState<string>(
    examples[0]?.key ?? ''
  );

  useEffect(() => {
    setExamplePick(examples[0]?.key ?? '');
  }, [examples]);

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
    const section = (current.data as any)?.[fieldKey];
    return section === undefined ? null : section;
  }, [current, fieldKey]);

  const titleText = fieldKey ? `${fieldTitle || fieldKey}` : '';

  const initialWidth =
    typeof window !== 'undefined'
      ? Math.min(520, Math.round(window.innerWidth * 0.3))
      : 520;

  return (
    <ResizableDrawer
      title={<span> <em>Examples</em>: {titleText} </span>}
      placement="right"
      open={open}
      onClose={onClose}
      initialWidth={initialWidth}
      minWidth={280}
      bodyPadding={16}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text type="secondary">Pick an example file:</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            options={exampleOptions}
            value={examplePick}
            onChange={setExamplePick}
          />
        </div>

        <FieldViewer
          fieldKey={fieldKey && fieldKey !== 'root' ? fieldKey : 'root'}
          value={displayedData}
          schema={schema}
          ajvValidator={validator}
          rootData={current?.data ?? null}
        />
      </Space>
    </ResizableDrawer>
  );
}

export type ExamplesContextValue = {
  openExamplesForField: (fieldKey: string) => void;
  closeExamples: () => void;
};

const ExamplesContext = createContext<ExamplesContextValue | null>(null);

/** Public hook */
export function useExamplesPanel(): ExamplesContextValue {
  const ctx = useContext(ExamplesContext);
  if (!ctx) throw new Error('useExamplesPanel must be used within ExamplesProvider');
  return ctx;
}

/** Provider */
export function ExamplesProvider({
  children,
  schema,
  selectedSchemaKey,
}: {
  children: React.ReactNode;
  schema: RJSFSchema;
  selectedSchemaKey: SchemaKey;
}) {
  const [open, setOpen] = useState(false);
  const [fieldKey, setFieldKey] = useState<string | null>(null);

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

  const openRef = useRef(open);
  const fieldKeyRef = useRef(fieldKey);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    fieldKeyRef.current = fieldKey;
  }, [fieldKey]);

  const openExamplesForField = useCallback(
    (incomingKey: string) => {
      try {
        window.dispatchEvent(new CustomEvent('x-close-preview'));
      } catch {}
      const key = normaliseKey(incomingKey);
      const isOpen = openRef.current;
      const currentKey = fieldKeyRef.current;

      if (isOpen && currentKey === key) {
        setOpen(false);
        return;
      }
      setFieldKey(key);
      setOpen(true);
    },
    [normaliseKey]
  );

  const closeExamples = useCallback(() => setOpen(false), []);

  const fieldTitle = fieldKey
    ? navItems.find((n) => n.key === fieldKey)?.title ?? fieldKey
    : '';

  useEffect(() => {
    setOpen(false);
    setFieldKey(null);
  }, [selectedSchemaKey, schema]);

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
      <ExamplePanelUI
        open={open}
        onClose={() => setOpen(false)}
        fieldKey={fieldKey}
        fieldTitle={fieldTitle}
        schema={schema}
        selectedSchemaKey={selectedSchemaKey}
      />
    </ExamplesContext.Provider>
  );
}
