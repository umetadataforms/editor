import { useRef, useState, useCallback } from 'react';
import type { ErrorSchema, RJSFValidationError } from '@rjsf/utils';
import { createErrorHandler, toErrorList, toErrorSchema, unwrapErrorHandler } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';
import { Box } from '@mantine/core';

import ToolbarPanel from './components/ToolbarPanel';
import { useImportJsonHandler } from './components/toolbar-panel-import';
import NavigationPanel from './components/NavigationPanel';
import { usePanelRegistry } from './components/Panels/panel-registry';
import PanelProviders from './components/Panels/PanelProviders';
import { PanelsProvider } from './components/Panels/Panels';
import Modeline, { useModelineState } from './components/Modeline';
import FormShell, { type FormData, type FormRef } from './components/FormShell';

import useSchemaSwitcher from './hooks/useSchemaSwitcher';
import useGenerateFromFile from './hooks/useGenerateFromFile';
import useLabelVersions from './hooks/useLabelVersions';
import type { CollapseController } from './types/collapse-controller';
import type { ItemReorderController } from './types/item-reorder-controller';
import type { TabularPager } from './types/tabular-pager';

import customValidator from './validation/custom-validators';
import transformErrors from './validation/transform-errors';

import useValidationHandler from './validation/useValidationHandler';

import { DEFAULT_SCHEMA_KEY } from './registries/schema-registry';

import INITIAL_FORM_DATA from './registries/initial-form-data-registry';

import './App.css';

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

const mergeErrorSchemas = (base?: ErrorSchema, extra?: ErrorSchema): ErrorSchema | undefined => {
  if (!base) return extra;
  if (!extra) return base;
  const merged: ErrorSchema = { ...base };
  const extraKeys = Object.keys(extra);
  extraKeys.forEach((key) => {
    if (key === '__errors') {
      const baseErrors = Array.isArray(base.__errors) ? base.__errors : [];
      const extraErrors = Array.isArray(extra.__errors) ? extra.__errors : [];
      merged.__errors = [...baseErrors, ...extraErrors];
      return;
    }
    merged[key] = mergeErrorSchemas(base[key] as ErrorSchema | undefined, extra[key] as ErrorSchema | undefined);
  });
  return merged;
};

/* -------------------------------------------------------------------------- */

export default function App() {

  const [formSeed, setFormSeed] = useState<FormData>(
    INITIAL_FORM_DATA[DEFAULT_SCHEMA_KEY]
  );
  const [navFormData, setNavFormData] = useState<FormData>(
    INITIAL_FORM_DATA[DEFAULT_SCHEMA_KEY]
  );
  const [extraErrors, setExtraErrors] = useState<ErrorSchema | undefined>(undefined);

  const formRef = useRef<FormRef | null>(null);
  const latestFormDataRef = useRef<FormData | null>(null);
  const tabularPagerRef = useRef<TabularPager | null>(null);
  const collapseControllerRef = useRef<CollapseController | null>(null);
  const itemReorderRef = useRef<ItemReorderController | null>(null);
  const getFormData = useCallback(
    () => latestFormDataRef.current ?? formSeed,
    [formSeed]
  );

  const setFormSeedAndNav = useCallback((next: FormData) => {
    setFormSeed(next);
    setNavFormData(next);
    setExtraErrors(undefined);
  }, []);

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
    setInitialFormData: setFormSeedAndNav,
  });

  const [navOpen, setNavOpen] = useState(false);
  const toggleNav = () => setNavOpen((v) => !v);

  const { handleFormSubmit, handleFormError } = useValidationHandler();
  const { labelVersion, fileLabelVersion, handleBlur } = useLabelVersions();
  const refreshNavData = useCallback((next?: FormData) => {
    setNavFormData(next ?? latestFormDataRef.current ?? formSeed);
  }, [formSeed]);

  const handleBlurWithNav = useCallback((id: string) => {
    handleBlur(id);
    if (
      (id.includes('_fields_') || id.includes('_variables_'))
      && id.endsWith('_label')
    ) {
      refreshNavData();
    }
  }, [handleBlur, refreshNavData]);

  const handleImportJson = useImportJsonHandler(selectSchemaImmediate);

  const {
    fileName: modelineFileName,
    handleFileNameChange,
    handleSaveStatusChange,
  } = useModelineState();

  const panelRegistry = usePanelRegistry({
    selectedSchemaKey,
    getFormData,
  });

  const {
    generateConfirmModal,
    handleGenerateFromFile,
    isGeneratingFromFile,
  } = useGenerateFromFile({
    onImportJson: handleImportJson,
    onFileNameChange: handleFileNameChange,
    onSaveStatusChange: handleSaveStatusChange,
  });

  const handleValidateFull = useCallback(() => {
    const data = latestFormDataRef.current;
    if (!data) {
      handleFormError([]);
      setExtraErrors(undefined);
      return;
    }

    const result = validator.validateFormData(data, schema);
    const ajvErrors = transformErrors(
      (result?.errors ?? []) as RJSFValidationError[],
      data,
      schema?.$id,
    );
    const ajvSchema = toErrorSchema(ajvErrors);

    const customErrorHandler = createErrorHandler(data);
    const customErrors = customValidator(data, customErrorHandler);
    const customSchema = unwrapErrorHandler(customErrors) as ErrorSchema | undefined;

    const mergedSchema = mergeErrorSchemas(ajvSchema, customSchema);
    const errorList = toErrorList(mergedSchema ?? {});

    setExtraErrors(mergedSchema && errorList.length > 0 ? mergedSchema : undefined);
    handleFormError(errorList);
  }, [handleFormError, schema]);

  return (
    <Box style={{ minHeight: '100vh' }}>
      {schemaSwitchConfirmModal}
      {generateConfirmModal}
      <PanelsProvider
        renderers={panelRegistry.renderers}
        headerActions={panelRegistry.headerActions}
      >
        <Box style={{ padding: 24, paddingLeft: 56 + 24 }}>
          <ToolbarPanel
            formRef={formRef}
            navOpen={navOpen}
            onToggleNav={toggleNav}
            selectedSchemaKey={selectedSchemaKey}
            onSelectSchema={onSelectSchema}
            getFormData={getFormData}
            onImportJson={handleImportJson}
            onFileNameChange={handleFileNameChange}
            onSaveStatusChange={handleSaveStatusChange}
            onGenerateFromFile={handleGenerateFromFile}
            isGeneratingFromFile={isGeneratingFromFile}
            onValidateFull={handleValidateFull}
          />
            <NavigationPanel
              key={selectedSchemaKey}
              schema={schema}
              navOpen={navOpen}
              navFormData={navFormData}
              tabularPagerRef={tabularPagerRef}
              collapseControllerRef={collapseControllerRef}
              itemReorderRef={itemReorderRef}
              onNavDataRefresh={refreshNavData}
            />
          <div className="content-wrap">
            <div id="anchor_root" className="umfe-top-level-root-anchor" />
            <div className="umfe-form-spacer-top" />
            <PanelProviders
              key={selectedSchemaKey}
              schema={schema}
              selectedSchemaKey={selectedSchemaKey}
              formDataRef={latestFormDataRef}
            >
              <FormShell
                key={`${selectedSchemaKey}-${formInstanceId}`}
                initialFormData={formSeed}
                formRef={formRef}
                schema={schema}
                uiSchema={uiSchema}
                formDataRef={latestFormDataRef}
                labelVersion={labelVersion}
                fileLabelVersion={fileLabelVersion}
                handleBlur={handleBlurWithNav}
                tabularPagerRef={tabularPagerRef}
                collapseControllerRef={collapseControllerRef}
                itemReorderRef={itemReorderRef}
                extraErrors={extraErrors}
                notifyFormMounted={notifyFormMounted}
                onNavDataRefresh={refreshNavData}
                onSubmit={handleFormSubmit}
                onError={handleFormError}
              />
            </PanelProviders>
            <div className="umfe-form-spacer-bottom" />
          </div>
        </Box>
      </PanelsProvider>
      <Modeline
        fileName={modelineFileName}
      />
    </Box>
  );
}
