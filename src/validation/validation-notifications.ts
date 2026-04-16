import { notifications } from '@mantine/notifications';
import type { RJSFValidationError } from '@rjsf/utils';

/**
 * Shows a notification based on validation results.
 */
export function notifyValidationResult(errors: RJSFValidationError[] | null) {
  if (errors == null) return;

  if (errors.length === 0) {
    notifications.show({ color: 'green', message: 'Validation: OK.' });
  } else {
    notifications.show({
      color: 'red',
      message: 'Validation failed. See the full list of errors at the top.',
    });
  }
}
