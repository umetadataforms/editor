import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { customizeValidator } from '@rjsf/validator-ajv8';
import type { RJSFSchema } from '@rjsf/utils';
import type { IChangeEvent } from '@rjsf/core';
import { useExamplesPanel } from './ExamplesPanel';
import ResizableDrawer from './ResizableDrawer';
import FieldViewer from './FieldViewer';

import { schemaToNavigationItems } from '../utils/navigation-items';

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

function PreviewPanelUI({
  open,
  onClose,
  fieldKey,
  fieldTitle,
  formData,
  schema,
}: {
  open: boolean;
  onClose: () => void;
  fieldKey: string | null;
  fieldTitle: string;
  formData: Record<string, any> | undefined;
  schema: RJSFSchema;
}) {
  const displayedData = useMemo(() => {
    if (!formData) return null;
    return fieldKey && fieldKey !== 'root' ? formData[fieldKey] : formData;
  }, [formData, fieldKey]);

  const titleText = fieldKey ? `${fieldTitle || fieldKey}` : '';

  const initialWidth = useMemo(() => {
    if (typeof window === 'undefined') return 520;
    return Math.min(520, Math.round(window.innerWidth * 0.3));
  }, []);

  return (
    <ResizableDrawer
      title={<span><em>Preview</em>: {titleText}</span>}
      placement="right"
      open={open}
      onClose={onClose}
      initialWidth={initialWidth}
      minWidth={280}
      bodyPadding={16}
    >
      <FieldViewer
        fieldKey={fieldKey && fieldKey !== 'root' ? fieldKey : 'root'}
        value={displayedData ?? null}
        schema={schema}
        ajvValidator={validator}
        rootData={formData ?? null}
      />
    </ResizableDrawer>
  );
}

export type PreviewContextValue = {
  openPreviewForField: (fieldKey: string) => void;
  setLatestFromChange: (ev: Pick<IChangeEvent, 'formData' | 'errors'>) => void;
  closePreview: () => void;
};

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function usePreviewPanel(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error('usePreviewPanel must be used within PreviewProvider');
  return ctx;
}

const normaliseKey = (raw: string, validKeys: Set<string>) => {
  let s = (raw || '').trim();
  s = s.replace(/^#/, '').replace(/^anchor_/, '');
  const rjsf = s.match(/^root_([^_]+)/);
  if (rjsf) {
    const top = rjsf[1];
    if (validKeys.has(top)) return top;
  }
  s = s.replace(/^root_/, '');
  if (validKeys.has(s)) return s;
  return s;
};

export function PreviewProvider({
  children,
  schema,
  initialFormData
}: {
  children: ReactNode;
  schema: Record<string, any>;
  initialFormData?: Record<string, any>;
}) {
  const [open, setOpen] = useState(false);
  const [fieldKey, setFieldKey] = useState<string | null>(null);

  const [formData, setFormData] =
    useState<Record<string, any> | undefined>(initialFormData);

  useEffect(() => {
    if (typeof initialFormData !== 'undefined') {
      setFormData(initialFormData);
    }
  }, [initialFormData]);

  const navItems = useMemo(
    () => schemaToNavigationItems(schema),
    [schema]
  );

  const navKeySet = useMemo(() => new Set(navItems.map((n) => n.key)), [navItems]);

  const openRef = useRef(open);
  const fieldKeyRef = useRef(fieldKey);
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { fieldKeyRef.current = fieldKey; }, [fieldKey]);
  useEffect(() => {
    const handle = () => setOpen(false);
    window.addEventListener('x-close-preview', handle);
    return () => window.removeEventListener('x-close-preview', handle);
  }, []);

  const { closeExamples } = useExamplesPanel();

  const openPreviewForField = useCallback((incomingKey: string) => {
    closeExamples?.();
    const key = normaliseKey(incomingKey, navKeySet);

    const isOpen = openRef.current;
    const currentKey = fieldKeyRef.current;
    if (isOpen && currentKey === key) {
      setOpen(false);
      return;
    }
    setFieldKey(key);
    setOpen(true);
  }, [closeExamples, navKeySet]);

  const closePreview = useCallback(() => setOpen(false), []);

  const fieldTitle = fieldKey
    ? navItems.find((n) => n.key === fieldKey)?.title ?? fieldKey
    : '';

  const setLatestFromChange = useCallback(
    (ev: Pick<IChangeEvent, 'formData' | 'errors'>) => {
      setFormData(ev.formData as any);
    },
    []
  );

  const value: PreviewContextValue = {
    openPreviewForField,
    setLatestFromChange,
    closePreview,
  };

  return (
    <PreviewContext.Provider value={value}>
      {children}
      <PreviewPanelUI
        open={open}
        onClose={() => setOpen(false)}
        fieldKey={fieldKey}
        fieldTitle={fieldTitle}
        formData={formData}
        schema={schema}
      />
    </PreviewContext.Provider>
  );
}
