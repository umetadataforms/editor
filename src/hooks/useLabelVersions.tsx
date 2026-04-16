import { useCallback, useState } from 'react';

/**
 * Tracks label edit versions for fields/variables/files.
 */
export default function useLabelVersions() {
  const [labelVersion, setLabelVersion] = useState(0);
  const [fileLabelVersion, setFileLabelVersion] = useState(0);

  const handleBlur = useCallback((id: string) => {
    if (id.includes('_fields_') && id.endsWith('_label')) {
      setLabelVersion((current) => current + 1);
    }
    if (id.includes('_variables_') && id.endsWith('_label')) {
      setLabelVersion((current) => current + 1);
    }
    if (id.includes('_files_') && id.endsWith('_label')) {
      setFileLabelVersion((current) => current + 1);
    }
  }, []);

  return {
    labelVersion,
    fileLabelVersion,
    handleBlur,
  };
}
