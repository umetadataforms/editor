import type {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { getUiOptions } from '@rjsf/utils';
import { Box } from '@mantine/core';
import FieldHeader from '../components/FieldHeader';

/** The `FieldTemplate` component is the template used by `SchemaField` to
 * render any field. It renders the field content (label, description, children,
 * errors, and help) through `WrapIfAdditionalTemplate`, which only wraps
 * additional properties.
 *
 * Changes from upstream: routes labels/descriptions through `FieldHeader` and
 * suppresses headers for object/array fields to avoid duplicate titles.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    fieldPathId,
    classNames,
    style,
    label,
    errors,
    help,
    rawDescription,
    displayLabel,
    hidden,
    required,
    schema,
    uiSchema,
    registry,
    children,
    ...otherProps
  } = props;

  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = registry.templates.WrapIfAdditionalTemplate;

  const isObjectOrArray = (() => {
    const type = schema?.type;
    if (Array.isArray(type)) {
      return type.includes('object') || type.includes('array');
    }
    return type === 'object' || type === 'array';
  })();

  const showHeader = Boolean(label)
    && (uiOptions.showHeader === true || (displayLabel !== false && !isObjectOrArray));

  if (hidden) {
    return <Box display='none'>{children}</Box>;
  }

  const fieldClassNames = [classNames, 'umfe-field'].filter(Boolean).join(' ');

  return (
    <WrapIfAdditionalTemplate
      id={id}
      classNames={fieldClassNames}
      style={style}
      label={label}
      displayLabel={false}
      rawDescription={rawDescription}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
      {...otherProps}
    >
      {showHeader ? (
        <FieldHeader
          label={label}
          rawDescription={rawDescription}
          fieldPathId={fieldPathId}
          formContext={registry.formContext}
          required={required}
        />
      ) : null}
      {children}
      {errors}
      {help}
    </WrapIfAdditionalTemplate>
  );
}
