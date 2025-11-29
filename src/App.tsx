import { useMemo, useRef, useState, useCallback, useEffect } from 'react';

import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';

// Theme imports
import Form from '@rjsf/antd';
import { Layout, ConfigProvider, theme, message } from 'antd';

// Tempalte imports
import TitleFieldTemplate from './templates/TitleFieldTemplate';
import DescriptionFieldTemplate from './templates/DescriptionFieldTemplate';
import FieldTemplate from './templates/FieldTemplate';
import ArrayFieldTemplate from './templates/ArrayFieldTemplate';
import ObjectFieldTemplate from './templates/ObjectFieldTemplate';

// Field imports
import NullField from './fields/NullField';
import MultiSchemaField from './fields/MultiSchemaField';

// Widget imports
import StringFieldWidget from './widgets/StringFieldWidgetDebounce';
import TextAreaWidget from './widgets/TextAreaWidget/TextAreaWidget';
import CountryWidget from './widgets/CountryWidget';
import CountryWidgetTempAlpha3 from './widgets/CountryWidgetTempAlpha3';
import CountrySubdivisionWidget from './widgets/CountrySubdivisionWidget';

// Custom panel imports
import ToolbarPanel from './components/ToolbarPanel';
import NavigationPanel from './components/NavigationPanel';
import { usePreviewPanel, PreviewProvider } from './components/PreviewPanel';
import {
  useExamplesPanel,
  ExamplesProvider,
} from './components/ExamplesPanel';
import Modeline, { type SaveStatus } from './components/Modeline';

// Hook imports
import useSchemaSwitcher from './hooks/useSchemaSwitcher';

// Custom validators
import customValidator from './utils/custom-validators';
import transformErrors from './utils/transform-errors';

// Schema registry
import SCHEMAREG, { DEFAULT_SCHEMA_KEY, type SchemaKey } from './utils/schema-registry';

// Initial form data. FIXME: Fix this to work without the initial data.
import INITIAL_FORM_DATA from './utils/initial-form-data';

import './App.css';

/* -------------------------------------------------------------------------- */

const { Content } = Layout;

const validator = customizeValidator({
  ajvOptionsOverrides: {
    allErrors: true,
    validateFormats: false,
    strict: false,
    inlineRefs: true,
    meta: false,
    validateSchema: false,
    code: { optimize: 1 },
  },
});

const TEMPLATES = {
  TitleFieldTemplate,
  DescriptionFieldTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
  ArrayFieldTemplate,
} as const;

const FIELDS = {
  OneOfField: MultiSchemaField,
  AnyOfField: MultiSchemaField,
  NullField,
} as const;

const WIDGETS = {
  TextAreaWidget,
  CountryWidget,
  CountryWidgetTempAlpha3, // FIXME
  CountrySubdivisionWidget,
  TextWidget: StringFieldWidget,
  EmailWidget: StringFieldWidget, // FIXME
  URLWidget: StringFieldWidget, // FIXME
} as const;

/** Keep latest formData in a ref so Toolbar/Preview/etc can read without causing rerenders */
const latestFormDataRef: { current: any } = { current: null };

/** Form Component */
function FormShell({
  formRef,
  formData,
  schema,
  uiSchema,
  notifyFormMounted,
  onSubmit,
  onError
}: {
  formRef: any;
  formData: any;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  notifyFormMounted: () => void;
  onSubmit: (ev: any) => void;
  onError: (errors: any[]) => void;
}) {
  const { openExamplesForField } = useExamplesPanel();

  const {
    openPreviewForField,
    setLatestFromChange
  } = usePreviewPanel();

  useEffect(() => {
    notifyFormMounted();
  }, [notifyFormMounted]);

  const formContextRef = useRef({
    openExamplesForField,
    openPreviewForField,
    currentFormDataRef: latestFormDataRef,
  });

  // keep callbacks up to date on each render
  formContextRef.current.openExamplesForField = openExamplesForField;
  formContextRef.current.openPreviewForField = openPreviewForField;

  // initial sync
  if (!latestFormDataRef.current) {
    latestFormDataRef.current = formData;
  }

  const handleChange = useCallback((ev: any) => {
    latestFormDataRef.current = ev.formData;
    setLatestFromChange({ formData: ev.formData, errors: ev.errors });
  }, [setLatestFromChange]);

  return (
    <Form
      ref={formRef}
      schema={schema}
      formData={formData}
      validator={validator}
      customValidate={customValidator}
      liveValidate={false}
      transformErrors={transformErrors}
      showErrorList="top"
      uiSchema={uiSchema}
      templates={TEMPLATES}
      fields={FIELDS}
      widgets={WIDGETS}
      onChange={handleChange}
      formContext={formContextRef.current}
      onSubmit={onSubmit}
      onError={onError}
    />
  );
}

export default function App() {

  const [isDarkMode, setDarkMode] = useState(true);
  const antdTheme = useMemo(() => ({
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    cssVar: true,
  }), [isDarkMode]);

  const [messageApi, contextHolder] = message.useMessage();

  const formRef = useRef<any>(null);

  const [formData, setFormData] = useState<Record<string, any>>(
    INITIAL_FORM_DATA[DEFAULT_SCHEMA_KEY]
  );
  // const [formData, setFormData] = useState<Record<string, any>>({});
  const getFormData = () => latestFormDataRef.current ?? formData;

  const [lastValidationErrors, setLastValidationErrors] = useState<any[] | null>(null);

  const handleFormSubmit = useCallback((ev: any) => {
    // no errors
    setLastValidationErrors([]);
  }, []);

  const handleFormError = useCallback((errors: any[]) => {
    // errors present
    setLastValidationErrors(errors);
  }, []);

  useEffect(() => {
    if (lastValidationErrors == null) return;   // nothing validated yet

    if (lastValidationErrors.length === 0) {
      messageApi.success('Validation: OK.');
    } else {
      messageApi.error(`Validation failed. See the full list of errors at the top.`);
    }
  }, [lastValidationErrors, messageApi]);

  const {
    schema,
    uiSchema,
    selectedSchemaKey,
    onSelectSchema,
    selectSchemaImmediate,
    schemaSwitchConfirmModal,
    notifyFormMounted,
    formInstanceId,
  } = useSchemaSwitcher({
    formDataRef: latestFormDataRef,
    setFormData,
  });

  const [navOpen, setNavOpen] = useState(false);
  const toggleNav = () => setNavOpen((v) => !v);

  // JSON data file import
  const handleImportJson = useCallback(
    (data: any) => {
      const rawSchemaKey = data?.schema || data?.$schema;

      if (!rawSchemaKey || typeof rawSchemaKey !== 'string') {
        messageApi.error('Imported JSON is missing a valid "schema" key.');
        throw new Error('handle-import-json-no-schema-key');
      }

      if (!(rawSchemaKey in SCHEMAREG)) {
        messageApi.error(`Unknown schema "${rawSchemaKey}" in imported JSON. Data not loaded.`);
        throw new Error('handle-import-json-unknown-schema-key');
      }

      const schemaKey = rawSchemaKey as SchemaKey;

      void selectSchemaImmediate(schemaKey);
      setFormData(data);
      latestFormDataRef.current = data;
      messageApi.success('Data loaded.')
    },
    [selectSchemaImmediate, setFormData, messageApi]
  );

  // Modeline
  const [modelineFileName, setModelineFileName] =
    useState<string>('unnamed');

  const [, setModelineStatus] = useState<SaveStatus>('ready');

  const handleFileNameChange = (name: string) =>
    setModelineFileName(name || 'metadata.json');

  const handleStatusChange = (status: SaveStatus) =>
    setModelineStatus(status);

  return (
    <ConfigProvider theme={antdTheme}>
      {contextHolder}
      <div className={isDarkMode ? 'is-dark' : undefined}>
        <Layout style={{ minHeight: '100vh' }}>
          <Content style={{ padding: 24, paddingLeft: 56 + 24 }}>
            {schemaSwitchConfirmModal}
            <ToolbarPanel
              isDark={isDarkMode}
              setDarkMode={setDarkMode}
              formRef={formRef}
              navOpen={navOpen}
              onToggleNav={toggleNav}
              selectedSchemaKey={selectedSchemaKey}
              onSelectSchema={onSelectSchema}
              getFormData={getFormData}
              onImportJson={handleImportJson}
              onFileNameChange={handleFileNameChange}
              onStatusChange={handleStatusChange}
              message={messageApi}
            />
            <NavigationPanel
              schema={schema}
              navOpen={navOpen}
            />
            <div className="content-wrap">
              <div id="anchor_root" className="x-top-level-root-anchor" />
              <ExamplesProvider
                schema={schema}
                selectedSchemaKey={selectedSchemaKey}
              >
                <PreviewProvider
                  schema={schema}
                  initialFormData={getFormData()}
                >
                  <FormShell
                    key={`${selectedSchemaKey}-${formInstanceId}`}
                    formData={formData}
                    formRef={formRef}
                    schema={schema}
                    uiSchema={uiSchema}
                    notifyFormMounted={notifyFormMounted}
                    onSubmit={handleFormSubmit}
                    onError={handleFormError}
                  />
                </PreviewProvider>
              </ExamplesProvider>
            </div>
          </Content>
          <Modeline
            fileName={modelineFileName}
          />
        </Layout>
      </div>
    </ConfigProvider>
  );
}
