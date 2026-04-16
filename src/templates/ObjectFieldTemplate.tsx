import type {
  FormContextType,
  ObjectFieldTemplatePropertyType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import {buttonId, canExpand, getUiOptions} from '@rjsf/utils';
import { Box, Container, Group, SimpleGrid } from '@mantine/core';
import type { MantineSpacing } from '@mantine/core';
import FieldHeader from '../components/FieldHeader';

/** The `ObjectFieldTemplate` is the template to use to render all the inner
 * properties of an object along with the title and description if available.
 * If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * Changes from upstream: uses `FieldHeader` for consistent label/description
 * styling and supports grid-based layout via `ui:options` (gridCols, spacing,
 * and template columns).
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectFieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    className,
    title,
    required,
    description,
    disabled,
    properties,
    optionalDataControl,
    onAddProperty,
    readonly,
    schema,
    uiSchema,
    fieldPathId,
    formData,
    registry,
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);

  const showOptionalDataControlInTitle = !readonly && !disabled;

  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const gridCols = (typeof uiOptions?.gridCols === 'number' && uiOptions?.gridCols) || undefined;
  const gridSpacing = uiOptions?.gridSpacing;
  const gridVerticalSpacing = uiOptions?.gridVerticalSpacing;

  const gridTemplateColumns = typeof uiOptions?.gridTemplateColumns === 'string'
    ? uiOptions.gridTemplateColumns
    : undefined;

  const rawDescription = typeof description === 'string'
    ? description
    : typeof uiOptions.description === 'string'
      ? uiOptions.description
      : typeof schema.description === 'string'
        ? schema.description
        : undefined;

  return (
    <Container id={fieldPathId.$id} p={0} className={className}>
      {title ? (
        <Box mb="xs">
          <FieldHeader
            label={title}
            rawDescription={rawDescription}
            fieldPathId={fieldPathId}
            optionalDataControl={showOptionalDataControlInTitle ? optionalDataControl : undefined}
            formContext={registry.formContext}
            required={required}
          />
        </Box>
      ) : null}
      <SimpleGrid
        cols={gridCols}
        spacing={gridSpacing as MantineSpacing | undefined}
        verticalSpacing={gridVerticalSpacing as MantineSpacing | undefined}
        style={gridTemplateColumns ? { gridTemplateColumns } : undefined}
        mb='sm'
      >
        {!showOptionalDataControlInTitle ? optionalDataControl : undefined}
          {properties
            .filter((e) => !e.hidden)
            .map((element: ObjectFieldTemplatePropertyType) => (
              <Box
                key={element.name}
                className={`umfe-object-field-prop umfe-object-field-${element.name}`}
              >
                {element.content}
              </Box>
            ))}
        </SimpleGrid>
      {canExpand(schema, uiSchema, formData) && (
        <Group mt='xs' justify='flex-end'>
          <AddButton
            id={buttonId(fieldPathId, 'add')}
            disabled={disabled || readonly}
            onClick={onAddProperty}
            className='rjsf-object-property-expand'
            uiSchema={uiSchema}
            registry={registry}
          />
        </Group>
      )}
    </Container>
  );
}
