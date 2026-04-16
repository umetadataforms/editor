import type {
  DescriptionFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { RichDescription } from '@rjsf/core';
import { Text } from '@mantine/core';

/** The `DescriptionField` renders a field description using `RichDescription`.
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function DescriptionField<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description, registry, uiSchema } = props;
  if (description) {
    return (
      <Text id={id} mt={3} mb='sm' component='div'>
        <RichDescription
          description={description}
          registry={registry}
          uiSchema={uiSchema}
        />
      </Text>
    );
  }

  return null;
}
