import type { RJSFValidationError } from '@rjsf/utils';

export default function transformErrors(errors: RJSFValidationError[]) {
  return errors.map(error => {
    if (error.name === 'additionalProperties') {
      const prop = (error.params as any)?.additionalProperty;
      if (prop) {
        const msg = `Unexpected field "${prop}" is not allowed by the schema.`
          + ` It is not visible in the form, remove it manually outside the App.`;

        // used for inline / field-level display
        error.message = msg;

        // used by the global ErrorList (top/bottom)
        // you can include the property path if you like:
        if (error.property) {
          error.stack = `${error.property} ${msg}`;
        } else {
          error.stack = msg;
        }
      }
    }
    return error;
  });
}
