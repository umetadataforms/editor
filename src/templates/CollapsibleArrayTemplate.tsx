import { memo, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import type {
  ArrayFieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { buttonId, getUiOptions } from '@rjsf/utils';
import { ActionIcon, Box, Button, Collapse, Group, Text, TextInput } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import FieldHeader from '../components/FieldHeader';
import type { UmfeFormContext } from '../types/form-context';

/**
 * Collapsible array template that wraps an array list.
 *
 * Behavior summary:
 * - Renders a FieldHeader with a collapse toggle icon.
 * - Collapses/expands the list body using Mantine `Collapse`.
 * - Shows the Add button aligned to the right when allowed.
 * - Marks newly added field items to open on add.
 *
 * Usage:
 * - Register via `ui:options.ArrayFieldTemplate` in uiSchema.
 *
 * Defaults:
 * - Starts opened.
 * - If `title` is missing, header is omitted and only the list renders.
 *
 * @param props - The `ArrayFieldTemplateProps` for this component
 */
const CollapsibleArrayTemplate = memo(function CollapsibleArrayTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldTemplateProps<T, S, F>) {
  const {
    canAdd,
    className,
    disabled,
    fieldPathId,
    items,
    optionalDataControl,
    onAddClick,
    readonly,
    schema,
    uiSchema,
    title,
    required,
    registry,
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const showOptionalDataControlInTitle = !readonly && !disabled;
  const formContext = registry.formContext as UmfeFormContext | undefined;
  const {
    isFieldsScope,
    isVariablesScope,
    pagingEnabled,
    page,
    pageCount,
    startIndex,
    endIndex,
    totalCount,
    shouldPaginate,
  } = useMemo(() => {
    const rootKey = fieldPathId.path.length > 0 ? String(fieldPathId.path[0]) : '';
    const fieldsScope = rootKey === 'fields';
    const variablesScope = rootKey === 'variables';
    const tabularSchema = Boolean(formContext?.isTabularSchema);
    const tabularVcSchema = Boolean(formContext?.isTabularVcSchema);
    const tabularScope = fieldsScope ? tabularSchema : variablesScope ? tabularVcSchema : false;
    const paging = formContext?.tabularPaging;
    const pageSize = formContext?.tabularPageSize ?? 10;
    const info = fieldsScope
      ? paging?.fields
      : variablesScope
        ? paging?.variables
        : undefined;
    const enabled = tabularScope && Boolean(info?.enabled);
    const total = enabled ? info?.total ?? items.length : items.length;
    const currentPage = enabled ? info?.page ?? 0 : 0;
    const totalPages = enabled ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    const start = enabled ? currentPage * pageSize : 0;
    const end = enabled ? Math.min(total, start + pageSize) : items.length;
    const paginate = enabled && total > pageSize;

    return {
      isFieldsScope: fieldsScope,
      isVariablesScope: variablesScope,
      pagingEnabled: enabled,
      page: currentPage,
      pageCount: totalPages,
      startIndex: start,
      endIndex: end,
      totalCount: total,
      shouldPaginate: paginate,
    };
  }, [
    fieldPathId.path,
    formContext?.isTabularSchema,
    formContext?.isTabularVcSchema,
    formContext?.tabularPaging,
    formContext?.tabularPageSize,
    items.length,
  ]);

  const markNextFieldOpen = formContext?.markNextFieldOpen;
  const setTabularPage = formContext?.setTabularPage;
  const [opened, setOpened] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const [isEditingPage, setIsEditingPage] = useState(false);
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const rawDescription = typeof uiOptions.description === 'string'
    ? uiOptions.description
    : typeof schema.description === 'string'
      ? schema.description
      : undefined;

  const handlePageChange = (nextPage: number) => {
    if (!pagingEnabled) return;
    setIsLoading(true);
    window.setTimeout(() => {
      if (isFieldsScope) {
        setTabularPage?.('fields', nextPage);
      }
      if (isVariablesScope) {
        setTabularPage?.('variables', nextPage);
      }
      requestAnimationFrame(() => setIsLoading(false));
    }, 0);
  };

  const handlePageInputCommit = () => {
    if (!shouldPaginate) return;
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setIsEditingPage(false);
      return;
    }
    handlePageChange(Math.max(0, Math.min(Math.floor(parsed) - 1, pageCount - 1)));
    setIsEditingPage(false);
  };

  const pageInputValue = isEditingPage ? pageInput : String(page + 1);

  const collapseToggle = (
    <ActionIcon
      size="sm"
      variant="subtle"
      className="umfe-collapsible-array-toggle"
      aria-label={opened ? 'Collapse fields list' : 'Expand fields list'}
      onClick={() => setOpened((value) => !value)}
    >
      {opened ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
    </ActionIcon>
  );

  const showHeader = Boolean(title) && uiOptions.label !== false;
  const handleAddClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isFieldsScope && markNextFieldOpen && !formContext?.isTabularSchema) {
      const nextIndex = pagingEnabled ? startIndex + items.length : totalCount;
      markNextFieldOpen(nextIndex);
    }
    onAddClick(event);
  };

  return (
    <Box
      className={className}
      id={fieldPathId.$id}
      style={isLoading ? { cursor: 'progress' } : undefined}
    >
      {showHeader ? (
        <Box mb="xs">
          <FieldHeader
            label={uiOptions.title || title}
            rawDescription={rawDescription}
            fieldPathId={fieldPathId}
            optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
            formContext={registry.formContext}
            labelAddon={collapseToggle}
            required={required}
          />
        </Box>
      ) : null}
      <Collapse in={opened}>
        <Box>
          <Box
            className='row rjsf-array-item-list'
            key={pagingEnabled ? `page-${page}` : 'page-0'}
          >
            {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
            {opened ? items : null}
          </Box>
          {shouldPaginate ? (
            <Group justify="space-between" align="center" mt="xs">
              <Text size="xs" c="dimmed">
                Showing {startIndex + 1}-{endIndex} of {totalCount}
              </Text>
              <Group gap="xs">
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 0 || isLoading}
                  loading={isLoading && page > 0}
                >
                  Prev
                </Button>
                <Text size="xs" c="dimmed">
                  Page {page + 1} of {pageCount}
                </Text>
                <TextInput
                  size="xs"
                  value={pageInputValue}
                  onChange={(event) => setPageInput(event.currentTarget.value)}
                  onFocus={() => {
                    setIsEditingPage(true);
                    setPageInput(String(page + 1));
                  }}
                  onBlur={handlePageInputCommit}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handlePageInputCommit();
                  }}
                  styles={{ input: { width: 64 } }}
                  type="number"
                  min={1}
                  max={pageCount}
                  aria-label="Go to page"
                />
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pageCount - 1 || isLoading}
                  loading={isLoading && page < pageCount - 1}
                >
                  Next
                </Button>
              </Group>
            </Group>
          ) : null}
          {canAdd && (
            <Group justify='flex-end' mt={shouldPaginate ? 'xs' : undefined}>
              <AddButton
                id={buttonId(fieldPathId, 'add')}
                className='rjsf-array-item-add'
                disabled={disabled || readonly}
                onClick={handleAddClick}
                uiSchema={uiSchema}
                registry={registry}
                iconType='md'
              />
            </Group>
          )}
        </Box>
      </Collapse>
    </Box>
  );
});

export default CollapsibleArrayTemplate;
