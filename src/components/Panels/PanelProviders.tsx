/**
 * Provider wrapper for preview/examples/description panels.
 */
import { useEffect } from 'react';
import type { ReactNode, RefObject } from 'react';

import type { RJSFSchema } from '@rjsf/utils';

import { DescriptionProvider } from './DescriptionPanel';
import { ExamplesProvider } from './ExamplesPanel';
import { PreviewProvider } from './PreviewPanel';
import { usePanels } from './Panels';
import type { SchemaKey } from '../../registries/schema-registry';

type PanelProvidersProps = {
  children: ReactNode;
  schema: RJSFSchema;
  selectedSchemaKey: SchemaKey;
  formDataRef?: RefObject<Record<string, unknown> | null>;
};

/**
 * Wraps the form in all panel providers without implying dependencies.
 */
export default function PanelProviders({
  children,
  schema,
  selectedSchemaKey,
  formDataRef,
}: PanelProvidersProps) {
  const { closeAllPanels } = usePanels();

  useEffect(() => {
    closeAllPanels();
  }, [closeAllPanels, selectedSchemaKey]);

  return (
    <ExamplesProvider schema={schema} selectedSchemaKey={selectedSchemaKey}>
      <PreviewProvider schema={schema} formDataRef={formDataRef}>
        <DescriptionProvider>{children}</DescriptionProvider>
      </PreviewProvider>
    </ExamplesProvider>
  );
}
