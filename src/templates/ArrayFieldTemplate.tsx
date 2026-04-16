import type {
  ArrayFieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { buttonId, getUiOptions } from '@rjsf/utils';
import { Box, Fieldset, Group } from '@mantine/core';
import FieldHeader from '../components/FieldHeader';

/** The `ArrayFieldTemplate` component renders array headers, items, and the add control.
 *
 * Changes from upstream: uses `FieldHeader` for consistent labels, supports
 * `ui:options.noFieldset`, and uses the custom `AddButton` template.
 *
 * @param props - The `ArrayFieldTemplateProps` props for the component
 */
export default function ArrayFieldTemplate<
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
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;

  const rawDescription = typeof uiOptions.description === 'string'
    ? uiOptions.description
    : typeof schema.description === 'string'
      ? schema.description
      : undefined;

  const { noFieldset } = uiOptions as { noFieldset?: boolean };
  const Wrapper = noFieldset ? Box : Fieldset;

  const showHeader = Boolean(title) && uiOptions.label !== false;

  return (
    <Wrapper className={className} id={fieldPathId.$id}>
      {showHeader ? (
        <Box mb="xs">
          <FieldHeader
            label={uiOptions.title || title}
            rawDescription={rawDescription}
            fieldPathId={fieldPathId}
            optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
            formContext={registry.formContext}
            required={required}
          />
        </Box>
      ) : null}
      <Box className='row rjsf-array-item-list'>
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
        {items}
      </Box>
      {canAdd && (
        <Group justify='flex-end'>
          <AddButton
            id={buttonId(fieldPathId, 'add')}
            className='rjsf-array-item-add'
            disabled={disabled || readonly}
            onClick={onAddClick}
            uiSchema={uiSchema}
            registry={registry}
            iconType='md'
          />
        </Group>
      )}
    </Wrapper>
  );
}
