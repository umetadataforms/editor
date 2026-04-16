import type { FormValidation } from '@rjsf/utils';

type ErrorNode = FormValidation<Record<string, unknown>>;

function validateCountrySubdiv(formData: Record<string, unknown> | undefined, errors: ErrorNode) {
  const geoAreas = (formData as { geographicCoverage?: { geographicAreas?: Array<Record<string, unknown>> } })
    ?.geographicCoverage
    ?.geographicAreas;

  if (Array.isArray(geoAreas)) {
    geoAreas.forEach((unit, i) => {
      const unitRecord = unit as { countryCode?: string; countrySubdivisionCodes?: unknown };
      const countryCode = unitRecord.countryCode;
      const subdivisions = unitRecord.countrySubdivisionCodes;

      if (!countryCode || !Array.isArray(subdivisions)) {
        return;
      }

      subdivisions.forEach((subCode: string, j: number) => {
        if (typeof subCode !== 'string') return;

        const expectedPrefix = `${countryCode}-`;
        if (!subCode.startsWith(expectedPrefix)) {
          // Attach the error to the specific subdivision entry
          const geoErrors = errors.geographicCoverage as ErrorNode | undefined;
          const areaErrors = (geoErrors?.geographicAreas as Array<ErrorNode> | undefined)?.[i];
          const subErrors = (areaErrors?.countrySubdivisionCodes as Array<ErrorNode> | undefined)?.[j];
          subErrors?.addError?.(
            `Subdivision code "${subCode}" must start with "${expectedPrefix}".`
          );
        }
      });
    });
  }

  return errors;
}

function validateTemporalCoverage(formData: Record<string, unknown> | undefined, errors: ErrorNode) {
  // Support both temporalCoverage and temporal_coverage
  const tc = (formData as { temporalCoverage?: Record<string, unknown>; temporal_coverage?: Record<string, unknown> })
    ?.temporalCoverage
    ?? (formData as { temporalCoverage?: Record<string, unknown>; temporal_coverage?: Record<string, unknown> })
      ?.temporal_coverage;

  if (!tc) return errors;

  const startDate = (tc as Record<string, unknown>)?.startDate ?? (tc as Record<string, unknown>)?.start_date;
  const endDate = (tc as Record<string, unknown>)?.endDate ?? (tc as Record<string, unknown>)?.end_date;

  // Only validate when both exist
  if (startDate && endDate) {
    const canCoerce = (value: unknown): value is string | number | Date =>
      typeof value === 'string' || typeof value === 'number' || value instanceof Date;
    if (!canCoerce(startDate) || !canCoerce(endDate)) {
      return errors;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);

    const tcErrors =
      (errors.temporalCoverage as ErrorNode | undefined)
      ?? (errors.temporal_coverage as ErrorNode | undefined);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return errors;
    }

    // Enforce startDate < endDate
    if (start > end) {
      // camelCase fields
      const tcErrorsRecord = tcErrors as Record<string, ErrorNode | undefined> | undefined;
      if (tcErrorsRecord?.endDate) {
        tcErrorsRecord.endDate.addError?.("End date must be after start date.");
      } else if (tcErrorsRecord?.startDate) {
        tcErrorsRecord.startDate.addError?.("Start date must be earlier than end date.");
      }

      // snake_case fields
      if (tcErrorsRecord?.end_date) {
        tcErrorsRecord.end_date.addError?.("End date must be after start date.");
      } else if (tcErrorsRecord?.start_date) {
        tcErrorsRecord.start_date.addError?.("Start date must be earlier than end date.");
      }
    }
  }

  return errors;
}

/**
 * Runs custom validation rules that are not covered by JSON Schema.
 */
export default function customValidator(formData: Record<string, unknown> | undefined, errors: ErrorNode) {
  validateCountrySubdiv(formData, errors);
  validateTemporalCoverage(formData, errors);
  return errors;
}
