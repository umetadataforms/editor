import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ActionIcon, Box, Button, Collapse, Text } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type {
  FormContextType,
  ObjectFieldTemplateProps,
  ObjectFieldTemplatePropertyType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { getUiOptions } from '@rjsf/utils';

type PropMap = Map<string, ObjectFieldTemplatePropertyType>;

type RenderOrderEntry =
  | string
  | {
    grid: string[];
  };

function buildPropMap(properties: ObjectFieldTemplatePropertyType[]): PropMap {
  return new Map(properties.map((prop) => [prop.name, prop]));
}

/**
 * Object template with a collapsible header, preview action, and structured
 * sections driven by uiSchema options.
 *
 * Behavior summary:
 * - Collapsible header with initial open state based on the array scope and collapse-all state.
 * - Preview button shown when `formContext.openPreviewForField` is available.
 * - Renders ordered sections and grid groups based on uiSchema options.
 *
 * uiSchema options:
 * - `renderOrder`: ordered list of field names and `{ grid: [...] }` groups.
 * - `headerLabelFields`: list of field keys to use for the header label, in
 *   priority order (first non-empty wins). Defaults to `['label']`.
 *
 * Fallbacks:
 * - If `renderOrder` is omitted, fields render in schema order with no grid.
 * - If `headerLabelFields` yields no value, falls back to schema title and a
 *   generic "Untitled Item" label.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function CollapsibleArrayItemTempalte<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const { fieldPathId, formData, properties, title, registry, uiSchema } = props;

  const propMap = useMemo(() => buildPropMap(properties), [properties]);

  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions) as {
    renderOrder?: RenderOrderEntry[];
    headerLabelFields?: string[];
  };

  const headerLabelFields = useMemo(
    () => Array.isArray(uiOptions.headerLabelFields) ? uiOptions.headerLabelFields : ['label'],
    [uiOptions.headerLabelFields]
  );

  const computeHeaderLabel = useCallback(
    (data: Record<string, unknown> | null | undefined) => {
      for (const key of headerLabelFields) {
        const value = data?.[key];
        if (typeof value === 'string' && value.trim().length > 0) {
          return value.trim();
        }
      }

      if (typeof title === 'string' && title.trim()) return title.trim();
      return 'Untitled Item';
    },
    [headerLabelFields, title]
  );

  const fileItemIndex = useMemo(() => {
    const path = fieldPathId.path;
    const filesIndex = path.findIndex((segment) => segment === 'files');
    if (filesIndex < 0 || filesIndex + 1 >= path.length) return null;
    const idx = Number(path[filesIndex + 1]);
    return Number.isFinite(idx) ? idx : null;
  }, [fieldPathId.path]);

  const fieldItemIndex = useMemo(() => {
    const path = fieldPathId.path;
    const fieldsIndex = path.findIndex((segment) => segment === 'fields');
    if (fieldsIndex < 0 || fieldsIndex + 1 >= path.length) return null;
    const idx = Number(path[fieldsIndex + 1]);
    return Number.isFinite(idx) ? idx : null;
  }, [fieldPathId.path]);

  const variableItemIndex = useMemo(() => {
    const path = fieldPathId.path;
    const variablesIndex = path.findIndex((segment) => segment === 'variables');
    if (variablesIndex < 0 || variablesIndex + 1 >= path.length) return null;
    const idx = Number(path[variablesIndex + 1]);
    return Number.isFinite(idx) ? idx : null;
  }, [fieldPathId.path]);

  const isFileItem = fileItemIndex !== null;
  const isFieldItem = fieldItemIndex !== null;
  const isVariableItem = variableItemIndex !== null;
  const fieldsCollapsed = registry.formContext?.fieldsCollapsed as boolean | undefined;
  const filesCollapsed = registry.formContext?.filesCollapsed as boolean | undefined;
  const variablesCollapsed = registry.formContext?.variablesCollapsed as boolean | undefined;
  const itemCollapseState = registry.formContext?.itemCollapseState as Record<string, boolean> | undefined;
  const collapseInstant = registry.formContext?.collapseInstant === true;
  const tabularPaging = registry.formContext?.tabularPaging as
    | { fields?: { enabled: boolean; page: number }; variables?: { enabled: boolean; page: number } }
    | undefined;
  const tabularPageSize = registry.formContext?.tabularPageSize as number | undefined;
  const setItemOpenState = registry.formContext?.setItemOpenState as
    | ((kind: 'fields' | 'files' | 'variables', index: number, open: boolean) => void)
    | undefined;

  const dataItemKind = isFieldItem
    ? 'fields'
    : isFileItem
      ? 'files'
      : isVariableItem
        ? 'variables'
        : undefined;
  const dataItemIndex = isFieldItem
    ? fieldItemIndex
    : isFileItem
      ? fileItemIndex
      : isVariableItem
        ? variableItemIndex
        : null;
  const defaultOpen = isFieldItem
    ? !(fieldsCollapsed ?? false)
    : isFileItem
      ? !(filesCollapsed ?? false)
      : isVariableItem
        ? !(variablesCollapsed ?? false)
        : true;

  const effectiveHeaderLabel = computeHeaderLabel(formData as Record<string, unknown>);

  const panelId = `${fieldPathId.$id}__tabular_panel`;
  const previewKey = fieldPathId.path.length > 0
    ? fieldPathId.path.map((seg) => String(seg)).join('.')
    : 'root';
  const localItemIndex = typeof dataItemIndex === 'number' ? dataItemIndex : undefined;
  const globalItemIndex = (() => {
    if (localItemIndex == null) return undefined;
    if (dataItemKind === 'fields' && tabularPaging?.fields?.enabled && tabularPageSize) {
      return tabularPaging.fields.page * tabularPageSize + localItemIndex;
    }
    if (dataItemKind === 'variables' && tabularPaging?.variables?.enabled && tabularPageSize) {
      return tabularPaging.variables.page * tabularPageSize + localItemIndex;
    }
    return localItemIndex;
  })();
  const collapseStateIndex = isFieldItem || isVariableItem
    ? (typeof globalItemIndex === 'number' ? globalItemIndex : dataItemIndex)
    : dataItemIndex;
  const itemKey = dataItemKind && typeof collapseStateIndex === 'number'
    ? `${dataItemKind}.${collapseStateIndex}`
    : null;
  const opened = typeof itemKey === 'string' && typeof itemCollapseState?.[itemKey] === 'boolean'
    ? itemCollapseState[itemKey]
    : defaultOpen;
  const previewKeyWithGlobal = (() => {
    if (globalItemIndex == null) return previewKey;
    if (dataItemKind === 'fields') return `fields[${globalItemIndex}]`;
    if (dataItemKind === 'variables') return `variables[${globalItemIndex}]`;
    if (dataItemKind === 'files') return `files[${globalItemIndex}]`;
    return previewKey;
  })();
  const openPreviewForField = registry.formContext?.openPreviewForField as ((key: string) => void) | undefined;
  const hasPreviewAction = Boolean(openPreviewForField);
  const canToggle = Boolean(setItemOpenState && dataItemKind && typeof collapseStateIndex === 'number');

  const toggleOpen = useCallback(() => {
    if (!dataItemKind || typeof collapseStateIndex !== 'number') return;
    setItemOpenState?.(dataItemKind, collapseStateIndex, !opened);
  }, [collapseStateIndex, dataItemKind, opened, setItemOpenState]);

  const renderOrder = Array.isArray(uiOptions.renderOrder)
    ? uiOptions.renderOrder
    : null;

  const { orderedBlocks, remainingFields } = useMemo(() => {
    const blocks: ReactNode[] = [];
    const remaining: ReactNode[] = [];
    const renderProp = (name: string) => {
      const prop = propMap.get(name);
      if (!prop || prop.hidden) return null;
      return (
        <Box key={name} className={`umfe-collapsible-object-block umfe-collapsible-object-${name}`}>
          {prop.content}
        </Box>
      );
    };

    if (renderOrder) {
      const usedKeys = new Set<string>();
      renderOrder.forEach((entry) => {
        if (typeof entry === 'string') {
          usedKeys.add(entry);
          const field = renderProp(entry);
          if (field) blocks.push(field);
          return;
        }
        if (entry && typeof entry === 'object' && Array.isArray(entry.grid)) {
          entry.grid.forEach((name) => usedKeys.add(name));
          const gridItems = entry.grid
            .map((name) => renderProp(name))
            .filter(Boolean);
          if (gridItems.length > 0) {
            blocks.push(
              <Box key={`grid-${blocks.length}`} className="umfe-collapsible-object-grid">
                {gridItems}
              </Box>
            );
          }
        }
      });

      properties
        .filter((prop) => !prop.hidden && !usedKeys.has(prop.name))
        .forEach((prop) => {
          remaining.push(
            <Box key={prop.name} className="umfe-collapsible-object-block">
              {prop.content}
            </Box>
          );
        });
    } else {
      properties
        .filter((prop) => !prop.hidden)
        .forEach((prop) => {
          blocks.push(
            <Box key={prop.name} className="umfe-collapsible-object-block">
              {prop.content}
            </Box>
          );
        });
    }

    return { orderedBlocks: blocks, remainingFields: remaining };
  }, [properties, propMap, renderOrder]);

  return (
    <Box
      id={fieldPathId.$id}
      className="umfe-collapsible-object-item"
      data-array-item-kind={dataItemKind}
      data-array-item-index={typeof globalItemIndex === 'number' ? globalItemIndex : undefined}
    >
      <Box className="umfe-collapsible-object-header">
        <Box
          role="button"
          tabIndex={0}
          className="umfe-collapsible-object-toggle"
          aria-expanded={opened}
          aria-controls={panelId}
          onClick={canToggle ? toggleOpen : undefined}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (canToggle) toggleOpen();
            }
          }}
        >
          <Box className="umfe-collapsible-object-header-inner">
            <Text className="umfe-collapsible-object-header-title">{effectiveHeaderLabel}</Text>
            <ActionIcon
              size="sm"
              variant="subtle"
              aria-label={opened ? 'Collapse field' : 'Expand field'}
              onClick={(event) => {
                event.stopPropagation();
                if (canToggle) toggleOpen();
              }}
            >
              {opened ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            </ActionIcon>
          </Box>
        </Box>
        <Box className="umfe-collapsible-object-actions">
          {hasPreviewAction ? (
            <Button
              size="xs"
              variant="default"
              onClick={() => openPreviewForField?.(previewKeyWithGlobal)}
            >
              Preview
            </Button>
          ) : null}
        </Box>
      </Box>
      <Collapse in={opened} id={panelId} transitionDuration={collapseInstant ? 0 : 200}>
        <Box className="umfe-collapsible-object-body">
          {orderedBlocks}
          {remainingFields}
        </Box>
      </Collapse>
    </Box>
  );
}
