import { useCallback, useEffect, useState } from 'react';
import type { RJSFValidationError } from '@rjsf/utils';

import { notifyValidationResult } from './validation-notifications';

/**
 * Tracks validation errors and surfaces notifications.
 */
export default function useValidationHandler() {
  const [lastValidationErrors, setLastValidationErrors] = useState<RJSFValidationError[] | null>(null);

  const handleFormError = useCallback((errors: RJSFValidationError[]) => {
    setLastValidationErrors(errors);
  }, []);

  const handleFormSubmit = useCallback(() => {
    setLastValidationErrors([]);
  }, []);

  useEffect(() => {
    notifyValidationResult(lastValidationErrors);
  }, [lastValidationErrors]);

  return {
    handleFormSubmit,
    handleFormError,
  };
}
