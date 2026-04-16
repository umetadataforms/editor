/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import Markdown from 'markdown-to-jsx';
import { Box } from '@mantine/core';
import type { PanelInstance } from './Panels';
import { usePanels } from './Panels';

type DescriptionPanelState = {
  title: string;
  description: string;
};

export type DescriptionContextValue = {
  openDescription: (state: DescriptionPanelState) => void;
  closeDescription: () => void;
};

const DescriptionContext = createContext<DescriptionContextValue | null>(null);

/** Access description panel controls from context. */
export function useDescriptionPanel(): DescriptionContextValue {
  const ctx = useContext(DescriptionContext);
  if (!ctx) throw new Error('useDescriptionPanel must be used within DescriptionProvider');
  return ctx;
}

/** Renders the description panel body for an info panel. */
type InfoPanelPayload = { description?: string };

export function InfoWindowContent({ panel }: { panel: PanelInstance }) {
  const payload = panel.payload as InfoPanelPayload | undefined;
  const description = payload?.description ?? '';
  return (
    <Box className="umfe-description-panel">
      <Markdown options={{ disableParsingRawHTML: true }}>
        {description}
      </Markdown>
    </Box>
  );
}

export const infoRenderer = (panel: PanelInstance) => (
  <InfoWindowContent panel={panel} />
);

/** Provides description panel context for opening info panels. */
export function DescriptionProvider({ children }: { children: ReactNode }) {
  const { openPanel, closePanelsByType } = usePanels();

  const openDescription = useCallback(
    ({ title, description }: DescriptionPanelState) => {
      openPanel('info', {
        title: `Docs: ${title}`,
        payload: { title, description },
      });
    },
    [openPanel]
  );

  const closeDescription = useCallback(() => closePanelsByType('info'), [closePanelsByType]);

  const value = useMemo(
    () => ({ openDescription, closeDescription }),
    [openDescription, closeDescription]
  );

  return (
    <DescriptionContext.Provider value={value}>
      {children}
    </DescriptionContext.Provider>
  );
}
