import type {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  SubmitButtonProps
} from '@rjsf/utils';
import { getSubmitButtonOptions } from '@rjsf/utils';
import { Button } from '@mantine/core';

/** The `SubmitButton` renders a button that represents the submit action.
 */
export default function SubmitButton<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema }: SubmitButtonProps<T, S, F>) {
  const { submitText, norender, props: submitButtonProps = {} } = getSubmitButtonOptions(uiSchema);
  if (norender) {
    return null;
  }
  return (
    <Button type='submit' variant='filled' {...submitButtonProps}>
      {submitText}
    </Button>
  );
}
