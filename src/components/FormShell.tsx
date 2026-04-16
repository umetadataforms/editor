import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { CollapseController } from '../types/collapse-controller';
import type { ItemReorderController } from '../types/item-reorder-controller';
import type { TabularPager } from '../types/tabular-pager';

import type RjsfForm from '@rjsf/core';
import Form from '@rjsf/mantine';
import type { ErrorSchema, FormContextType, RJSFSchema, RJSFValidationError, UiSchema } from '@rjsf/utils';
import { customizeValidator } from '@rjsf/validator-ajv8';

import TABULAR_FIELD_ITEM_TEMPLATE from '../data/initial/initial-field-item-tabular-data-v0.0.1';
import TABULAR_VARIABLE_ITEM_TEMPLATE from '../data/initial/initial-variable-item-tabular-data-vc';
import { useExamplesPanel } from './Panels/ExamplesPanel';
import { usePreviewPanel } from './Panels/PreviewPanel';
import ContextMenu from './ContextMenu';
import customValidator from '../validation/custom-validators';
import transformErrors from '../validation/transform-errors';
import { FIELDS, TEMPLATES, WIDGETS } from '../registries/rjsf-registry';
import unsetEmptyById from '../utils/unset-empty-by-id';
import useCollapsibleItems from '../hooks/useCollapsibleItems';
import useTabularPaging from '../hooks/useTabularPaging';
import { isTabularSchemaId, isTabularVcSchemaId } from '../utils/tabular-schema-ids';

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

export type FormData = Record<string, unknown>;
export type FormRef = RjsfForm<FormData, RJSFSchema, FormContextType>;

type ChangeEvent = { formData?: FormData };

/** Form Component */
export default function FormShell({
  formRef,
  initialFormData,
  schema,
  uiSchema,
  formDataRef,
  labelVersion,
  fileLabelVersion,
  handleBlur,
  tabularPagerRef,
  collapseControllerRef,
  itemReorderRef,
  extraErrors,
  notifyFormMounted,
  onNavDataRefresh,
  onSubmit,
  onError,
}: {
  formRef: RefObject<FormRef | null>;
  initialFormData: FormData | null;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formDataRef: { current: FormData | null };
  labelVersion: number;
  fileLabelVersion: number;
  handleBlur: (id: string) => void;
  tabularPagerRef: RefObject<TabularPager | null>;
  collapseControllerRef: RefObject<CollapseController | null>;
  itemReorderRef: RefObject<ItemReorderController | null>;
  extraErrors?: ErrorSchema;
  notifyFormMounted: () => void;
  onNavDataRefresh?: (data?: FormData) => void;
  onSubmit: () => void;
  onError: (errors: RJSFValidationError[]) => void;
}) {
  const { openExamplesForField } = useExamplesPanel();
  const { openPreviewForField } = usePreviewPanel();

  const isTabularSchema = isTabularSchemaId(schema?.$id);
  const isTabularVcSchema = isTabularVcSchemaId(schema?.$id);
  const pagingThreshold = 10;
  const tabularPageSize = 10;
  const {
    formData,
    setFormData,
    fullFormDataRef,
    tabularPaging,
    tabularPageSize: resolvedTabularPageSize,
    setTabularPage,
    buildPagedFormData,
    mergePagedData,
    ensurePagingEnabled,
    removeItem,
    moveItem,
  } = useTabularPaging({
    initialFormData,
    isTabularSchema,
    isTabularVcSchema,
    formDataRef,
    pagingThreshold,
    pageSize: tabularPageSize,
  });
  const [collapseInstant, setCollapseInstant] = useState(false);
  const prevFormDataRef = useRef(formData);

  const applyFieldTemplate = useCallback((nextData: FormData) => {
    if (!nextData) return nextData;

    let patchedData = nextData;

    if (isTabularSchema) {
      const prevFields = Array.isArray(prevFormDataRef.current?.fields)
        ? prevFormDataRef.current.fields
        : [];
      const nextFields = Array.isArray(nextData.fields) ? nextData.fields : null;
      if (nextFields && nextFields.length > prevFields.length) {
        let didPatch = false;
        const patchedFields = nextFields.map((item: unknown, index: number) => {
          if (index < prevFields.length) return item;
          didPatch = true;
          const template = typeof structuredClone === 'function'
            ? structuredClone(TABULAR_FIELD_ITEM_TEMPLATE)
            : { ...TABULAR_FIELD_ITEM_TEMPLATE };
          if (item && typeof item === 'object') {
            return { ...template, ...(item as Record<string, unknown>) };
          }
          return template;
        });
        if (didPatch) {
          patchedData = { ...patchedData, fields: patchedFields };
        }
      }
    }

    const prevVariables = Array.isArray(prevFormDataRef.current?.variables)
      ? prevFormDataRef.current.variables
      : [];
    const nextVariables = Array.isArray(nextData.variables) ? nextData.variables : null;
    if (nextVariables && nextVariables.length > prevVariables.length) {
      let didPatch = false;
      const patchedVariables = nextVariables.map((item: unknown, index: number) => {
        if (index < prevVariables.length) return item;
        didPatch = true;
        const template = typeof structuredClone === 'function'
          ? structuredClone(TABULAR_VARIABLE_ITEM_TEMPLATE)
          : { ...TABULAR_VARIABLE_ITEM_TEMPLATE };
        if (item && typeof item === 'object') {
          return { ...template, ...(item as Record<string, unknown>) };
        }
        return template;
      });
      if (didPatch) {
        patchedData = { ...patchedData, variables: patchedVariables };
      }
    }

    return patchedData;
  }, [isTabularSchema]);

  useEffect(() => {
    prevFormDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    notifyFormMounted();
  }, [notifyFormMounted]);

  const {
    canCollapseItems,
    isTabularSchema: canCollapseTabular,
    isTabularVcSchema: canCollapseTabularVc,
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
  } = useCollapsibleItems({
    schemaId: schema?.$id,
  });

  useEffect(() => {
    tabularPagerRef.current = {
      isTabularSchema: canCollapseTabular,
      isTabularVcSchema: canCollapseTabularVc,
      pageSize: resolvedTabularPageSize,
      setTabularPage,
    };
    return () => {
      tabularPagerRef.current = null;
    };
  }, [
    tabularPagerRef,
    canCollapseTabular,
    canCollapseTabularVc,
    resolvedTabularPageSize,
    setTabularPage,
  ]);

  useEffect(() => {
    collapseControllerRef.current = {
      collapseAll: (kind) => {
        if (kind === 'fields') toggleFieldsCollapsed(true);
        if (kind === 'variables') toggleVariablesCollapsed(true);
      },
      expandItem: (kind, index) => {
        setItemOpenState?.(kind, index, true);
      },
      setInstantCollapse: setCollapseInstant,
    };
    return () => {
      collapseControllerRef.current = null;
    };
  }, [
    collapseControllerRef,
    toggleFieldsCollapsed,
    toggleVariablesCollapsed,
    setItemOpenState,
    setCollapseInstant,
  ]);

  useEffect(() => {
    itemReorderRef.current = { moveItem };
    return () => {
      itemReorderRef.current = null;
    };
  }, [itemReorderRef, moveItem]);

  const removeTabularItem = useCallback((kind: 'fields' | 'variables', index: number) => {
    const updated = removeItem(kind, index);
    onNavDataRefresh?.(updated);
  }, [onNavDataRefresh, removeItem]);

  const baseFormContext = useMemo(() => ({
    openExamplesForField,
    openPreviewForField,
    currentFormDataRef: formDataRef,
    removeTabularItem,
    labelVersion,
    fileLabelVersion,
    showMoveButtons,
  }), [
    openExamplesForField,
    openPreviewForField,
    removeTabularItem,
    labelVersion,
    fileLabelVersion,
    formDataRef,
    showMoveButtons,
  ]);

  const collapsibleFormContext = useMemo(() => {
    if (!canCollapseItems) return null;
    return {
      fieldsCollapsed,
      fieldsCollapseVersion,
      toggleFieldsCollapsed,
      filesCollapsed,
      filesCollapseVersion,
      toggleFilesCollapsed,
      variablesCollapsed,
      variablesCollapseVersion,
      toggleVariablesCollapsed,
      isTabularSchema: canCollapseTabular,
      isTabularVcSchema: canCollapseTabularVc,
      markNextFieldOpen,
      itemCollapseState,
      setItemOpenState,
      collapseInstant,
    };
  }, [
    canCollapseItems,
    fieldsCollapsed,
    fieldsCollapseVersion,
    toggleFieldsCollapsed,
    filesCollapsed,
    filesCollapseVersion,
    toggleFilesCollapsed,
    variablesCollapsed,
    variablesCollapseVersion,
    toggleVariablesCollapsed,
    canCollapseTabular,
    canCollapseTabularVc,
    markNextFieldOpen,
    itemCollapseState,
    setItemOpenState,
    collapseInstant,
  ]);

  const tabularFormContext = useMemo(() => {
    if (!canCollapseTabular && !canCollapseTabularVc) return null;
    return {
      tabularPaging,
      tabularPageSize: resolvedTabularPageSize,
      setTabularPage,
    };
  }, [canCollapseTabular, canCollapseTabularVc, tabularPaging, resolvedTabularPageSize, setTabularPage]);

  const formContext = useMemo(
    () => ({
      ...baseFormContext,
      ...(collapsibleFormContext ?? {}),
      ...(tabularFormContext ?? {}),
    }),
    [baseFormContext, collapsibleFormContext, tabularFormContext]
  );

  const handleChange = useCallback((ev: ChangeEvent, changedId?: string) => {
    const prevFieldsCount = Array.isArray(fullFormDataRef.current?.fields)
      ? fullFormDataRef.current.fields.length
      : 0;
    const prevVariablesCount = Array.isArray(fullFormDataRef.current?.variables)
      ? fullFormDataRef.current.variables.length
      : 0;
    const patchedFormData = applyFieldTemplate(ev.formData ?? {});
    const selectorChange = changedId?.endsWith('__oneof_select') || changedId?.endsWith('__anyof_select');
    const prunedFormData = selectorChange
      ? patchedFormData
      : unsetEmptyById(patchedFormData, changedId);
    const mergedFormData = mergePagedData(prunedFormData);
    const nextFieldsCount = Array.isArray(mergedFormData.fields)
      ? mergedFormData.fields.length
      : 0;
    const nextVariablesCount = Array.isArray(mergedFormData.variables)
      ? mergedFormData.variables.length
      : 0;
    if (
      onNavDataRefresh
      && (prevFieldsCount !== nextFieldsCount || prevVariablesCount !== nextVariablesCount)
    ) {
      onNavDataRefresh(mergedFormData);
    }

    if (Array.isArray(prunedFormData.fields)) {
      if (ensurePagingEnabled('fields')) return;
    }

    if (Array.isArray(prunedFormData.variables)) {
      if (ensurePagingEnabled('variables')) return;
    }

    if (tabularPaging.fields.enabled && Array.isArray(prunedFormData.fields)) {
      if (prunedFormData.fields.length > resolvedTabularPageSize) {
        const total = Array.isArray(fullFormDataRef.current.fields)
          ? fullFormDataRef.current.fields.length
          : 0;
        const page = Math.max(0, Math.ceil(total / resolvedTabularPageSize) - 1);
        setTabularPage('fields', page);
        return;
      }
    }

    if (tabularPaging.variables.enabled && Array.isArray(prunedFormData.variables)) {
      if (prunedFormData.variables.length > resolvedTabularPageSize) {
        const total = Array.isArray(fullFormDataRef.current.variables)
          ? fullFormDataRef.current.variables.length
          : 0;
        const page = Math.max(0, Math.ceil(total / resolvedTabularPageSize) - 1);
        setTabularPage('variables', page);
        return;
      }
    }

    const pagingEnabled = tabularPaging.fields.enabled || tabularPaging.variables.enabled;
    if (!pagingEnabled) {
      setFormData(mergedFormData);
      return;
    }

    setFormData(buildPagedFormData(fullFormDataRef.current, tabularPaging));
  }, [
    applyFieldTemplate,
    mergePagedData,
    ensurePagingEnabled,
    buildPagedFormData,
    fullFormDataRef,
    resolvedTabularPageSize,
    setTabularPage,
    setFormData,
    tabularPaging,
    onNavDataRefresh,
  ]);

  const handleTransformErrors = useCallback((errors: RJSFValidationError[]) => (
    transformErrors(errors, fullFormDataRef.current ?? formDataRef.current ?? undefined, schema?.$id)
  ), [formDataRef, fullFormDataRef, schema?.$id]);

  return (
    <ContextMenu
      canCollapseItems={canCollapseItems}
      isTabularSchema={isTabularSchema}
      isTabularVcSchema={isTabularVcSchema}
      onToggleFieldsCollapsed={toggleFieldsCollapsed}
      onToggleFilesCollapsed={toggleFilesCollapsed}
      onToggleVariablesCollapsed={toggleVariablesCollapsed}
      onRequestCollapseItem={requestCollapseItem}
      onOpenPreview={openPreviewForField}
      onShowMoveButtons={setShowMoveButtons}
    >
      <Form
        ref={formRef}
        schema={schema}
        formData={formData}
        validator={validator}
        customValidate={customValidator}
        experimental_defaultFormStateBehavior={{ constAsDefaults: 'never' }}
        liveValidate={false}
        transformErrors={handleTransformErrors}
        showErrorList="top"
        extraErrors={extraErrors}
        uiSchema={uiSchema}
        templates={TEMPLATES}
        fields={FIELDS}
        widgets={WIDGETS}
        onChange={handleChange}
        onBlur={handleBlur}
        formContext={formContext}
        onSubmit={onSubmit}
        onError={onError}
      />
    </ContextMenu>
  );
}
