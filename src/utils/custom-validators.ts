
function validateCountrySubdiv(formData: any, errors: any) {
  const geoAreas = formData?.geographicCoverage?.geographicAreas;

  if (Array.isArray(geoAreas)) {
    geoAreas.forEach((unit, i) => {
      const countryCode = unit?.countryCode;
      const subdivisions = unit?.countrySubdivisionCodes;

      if (!countryCode || !Array.isArray(subdivisions)) {
        return;
      }

      subdivisions.forEach((subCode: string, j: number) => {
        if (typeof subCode !== 'string') return;

        const expectedPrefix = `${countryCode}-`;
        if (!subCode.startsWith(expectedPrefix)) {
          // Attach the error to the specific subdivision entry
          errors
            ?.geographicCoverage
            ?.geographicAreas?.[i]
            ?.countrySubdivisionCodes?.[j]
            ?.addError(
              `Subdivision code "${subCode}" must start with "${expectedPrefix}".`
            );
        }
      });
    });
  }

  return errors;
}

function validateTemporalCoverage(formData: any, errors: any) {
  // Support both temporalCoverage and temporal_coverage
  const tc = formData?.temporalCoverage ?? formData?.temporal_coverage;

  if (!tc) return errors;

  const startDate = tc.startDate ?? tc.start_date;
  const endDate = tc.endDate ?? tc.end_date;

  // Only validate when both exist
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const tcErrors =
      errors.temporalCoverage ?? errors.temporal_coverage;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      // Attach a generic error to the group
      tcErrors?.addError?.("Invalid date format.");
      return errors;
    }

    // Enforce startDate < endDate
    if (start > end) {
      // camelCase fields
      if (tcErrors?.endDate) {
        tcErrors.endDate.addError("End date must be after start date.");
      } else if (tcErrors?.startDate) {
        tcErrors.startDate.addError("Start date must be earlier than end date.");
      }

      // snake_case fields
      if (tcErrors?.end_date) {
        tcErrors.end_date.addError("End date must be after start date.");
      } else if (tcErrors?.start_date) {
        tcErrors.start_date.addError("Start date must be earlier than end date.");
      }
    }
  }

  return errors;
}

export default function customValidator(formData: any, errors: any) {
  validateCountrySubdiv(formData, errors);
  validateTemporalCoverage(formData, errors)
  return errors;
}
