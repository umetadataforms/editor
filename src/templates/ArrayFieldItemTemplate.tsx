import { memo } from 'react';
import type {
  ArrayFieldItemTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { Box, Flex, Group, Text } from '@mantine/core';
import type { UmfeFormContext } from '../types/form-context';

/** The `ArrayFieldItemTemplate` component renders array items.
 *
 * Changes from upstream: injects tag context labels for field/category tag
 * items and customizes layout to align item controls with the content block.
 *
 * @param props - The `ArrayFieldItemTemplateProps` props for the component
 */
const ArrayFieldItemTemplate = memo(function ArrayFieldItemTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldItemTemplateProps<T, S, F>) {
  const { buttonsProps, className, hasToolbar, index, registry, children } = props;
  const ArrayFieldItemButtonsTemplate = registry.templates.ArrayFieldItemButtonsTemplate;

  // labelVersion increments on label blur to refresh mirrored labels in field headers.
  const formContext = registry.formContext as UmfeFormContext | undefined;
  type FieldItem = { label?: string; categories?: Array<{ label?: string }> };
  const currentFormData = formContext?.currentFormDataRef?.current as
    | { fields?: FieldItem[] }
    | null
    | undefined;
  const tabularPaging = formContext?.tabularPaging;
  const tabularPageSize = formContext?.tabularPageSize;

  // Resolves the context label (Field Tag / Category Tag / Field Resource) to show
  // which parent label the current item belongs to.
  const tagContext = (() => {
    const path = buttonsProps.fieldPathId.path;
    const fieldsIndex = path.findIndex((segment) => segment === 'fields');
    if (fieldsIndex < 0) return null;

    const fieldIdx = Number(path[fieldsIndex + 1]);
    if (!Number.isFinite(fieldIdx)) return null;
    const globalFieldIdx = tabularPaging?.fields?.enabled && tabularPageSize
      ? tabularPaging.fields.page * tabularPageSize + fieldIdx
      : fieldIdx;

    const fieldsData = currentFormData?.fields;

    const resourcesIndex = path.findIndex((segment) => segment === 'resources');
    if (resourcesIndex >= 0 && resourcesIndex > fieldsIndex) {
      const resourceIdx = Number(path[resourcesIndex + 1]);
      if (!Number.isFinite(resourceIdx)) return null;
      const label = typeof fieldsData?.[globalFieldIdx]?.label === 'string'
        ? fieldsData[globalFieldIdx].label.trim()
        : '';
      return { kind: 'Resource for Field', label: label || 'No Label' };
    }

    const categoriesIndex = path.findIndex((segment) => segment === 'categories');
    const tagsIndex = path.findIndex((segment) => segment === 'tags');
    if (tagsIndex < 0) return null;

    if (categoriesIndex >= 0) {
      if (categoriesIndex < fieldsIndex || tagsIndex < categoriesIndex) return null;
      const categoryIdx = Number(path[categoriesIndex + 1]);
      if (!Number.isFinite(categoryIdx)) return null;
      const label = typeof fieldsData?.[globalFieldIdx]?.categories?.[categoryIdx]?.label === 'string'
        ? fieldsData[globalFieldIdx].categories[categoryIdx].label.trim()
        : '';
      return { kind: 'Tag for Category ', label: label || 'No Label' };
    }

    if (tagsIndex < fieldsIndex) return null;
    const label = typeof fieldsData?.[globalFieldIdx]?.label === 'string'
      ? fieldsData[globalFieldIdx].label.trim()
      : '';
    return { kind: 'Tag for Field', label: label || 'No Label' };
  })();

  return (
    <Box key={`array-item-${index}`} className={className || 'rjsf-array-item'} mb='xs'>
      {tagContext ? (
        <Text size='xs' c='dimmed' className='umfe-tag-label'>
          {`${tagContext.kind}: ${tagContext.label}`}
        </Text>
      ) : null}
      <Flex gap='xs' align='end' justify='center'>
        <Box w='100%'>{children}</Box>
        {hasToolbar && (
          <Group wrap='nowrap' gap={2} mb={7}>
            <ArrayFieldItemButtonsTemplate {...buttonsProps} />
          </Group>
        )}
      </Flex>
    </Box>
  );
});

export default ArrayFieldItemTemplate;
