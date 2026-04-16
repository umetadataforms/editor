/* eslint-disable react-refresh/only-export-components */
/**
 * Panels window manager and context.
 */
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowsDiagonal,
  IconPinned,
  IconPinnedOff,
  IconWindowMaximize,
  IconWindowMinimize,
  IconX
} from '@tabler/icons-react';

import { getDefaultSize } from './panel-dimensions';
import { clampPosition, getStackedPosition, resolveInitialPosition } from './panel-positions';

/* -------------------------------------------------------------------------- */

/**
 * Supported panel types.
 */
export type PanelType = 'preview' | 'examples' | 'info';

/**
 * Payload attached to a panel instance.
 */
export type PanelPayload = Record<string, unknown>;

/**
 * Runtime state for a single panel.
 */
export type PanelInstance = {
  id: string;
  type: PanelType;
  title: string;
  payload?: PanelPayload;
  position: { x: number; y: number };
  size: { width: number; height: number };
  expandedSize?: { width: number; height: number }; // vs minimised size
  minimized: boolean;
  dedicated: boolean; // pinned/detached
  zIndex: number;
  open: boolean;
};

/**
 * Render function for a panel body.
 */
export type PanelRenderer = (panel: PanelInstance) => ReactNode;

/**
 * Optional header action renderer for a panel.
 */
export type PanelHeaderAction = (panel: PanelInstance) => ReactNode;

/**
 * Header actions by panel type.
 */
export type PanelHeaderActions = Partial<Record<PanelType, PanelHeaderAction>>;

type OpenPanelOptions = {
  title: string;
  payload?: PanelPayload;
  defaultSize?: { width: number; height: number };
};

type PanelsContextValue = {
  panels: PanelInstance[];
  openPanel: (type: PanelType, options: OpenPanelOptions) => string;
  closePanel: (id: string) => void;
  closePanelsByType: (type: PanelType) => void;
  closeAllPanels: () => void;
  toggleMinimize: (id: string) => void;
  resetPanelSize: (id: string) => void;
  bringToFront: (id: string) => void;
  updatePanel: (id: string, next: Partial<PanelInstance>) => void;
};

const PanelsContext = createContext<PanelsContextValue | null>(null);

const HEADER_HEIGHT = 36;
const PANEL_TOOLTIP_Z_INDEX = 1100;

let closeAllPanelsHandler: (() => void) | null = null;

/** Register or clear the global close handler for schema switches. */
export function registerCloseAllPanels(handler: (() => void) | null) {
  closeAllPanelsHandler = handler;
}

/** Request closing all panels before a schema switch. */
export function requestCloseAllPanels() {
  closeAllPanelsHandler?.();
}

const updatePanelList = (
  panels: PanelInstance[],
  id: string,
  next: Partial<PanelInstance>,
) => panels.map((panel) => panel.id === id ? { ...panel, ...next } : panel);

const bringToFrontInList = (
  panels: PanelInstance[],
  id: string,
  zIndex: number,
) => {
  if (!panels.some((panel) => panel.id === id)) return panels;
  return panels.map((panel) => panel.id === id ? { ...panel, zIndex } : panel);
};

const toggleMinimizeInList = (panels: PanelInstance[], id: string) => panels.map((panel) => {
  if (panel.id !== id) return panel;
  if (!panel.minimized) {
    return {
      ...panel,
      minimized: true,
      expandedSize: panel.expandedSize ?? panel.size,
      size: { width: panel.size.width, height: HEADER_HEIGHT },
    };
  }
  const restore = panel.expandedSize ?? panel.size;
  return {
    ...panel,
    minimized: false,
    size: { width: restore.width, height: restore.height },
    expandedSize: undefined,
  };
});

const resetPanelSizeInList = (panels: PanelInstance[], id: string) => panels.map((panel) => {
  if (panel.id !== id) return panel;
  const size = getDefaultSize(panel.type);
  const position = panel.type === 'preview' || panel.type === 'examples'
    ? getStackedPosition(panel.type, size)
    : resolveInitialPosition(panel.type, size);
  return {
    ...panel,
    size,
    position,
    minimized: false,
    expandedSize: undefined,
  };
});

/** Access panel state/actions from context. */
export function usePanels() {
  const ctx = useContext(PanelsContext);
  if (!ctx) throw new Error('usePanels must be used within PanelsProvider');
  return ctx;
}

/**
 * Draggable, resizable panel shell with header controls.
 * - Pinning detaches the panel from managed panels; close to remove it.
 */
function PanelWindow({
  panel,
  children,
  headerActions,
  onClose,
  onToggleMinimize,
  onResetSize,
  onTogglePin,
  onBringToFront,
  onDragStop,
  onResizeStop,
}: {
  panel: PanelInstance;
  children: ReactNode;
  headerActions?: ReactNode;
  onClose: () => void;
  onToggleMinimize: () => void;
  onResetSize: () => void;
  onTogglePin?: () => void;
  onBringToFront: () => void;
  onDragStop: (x: number, y: number) => void;
  onResizeStop: (
    width: number,
    height: number,
    x: number,
    y: number,
  ) => void;
}) {
  const { size, position, minimized, title, dedicated, zIndex } = panel;
  const displayPosition = clampPosition(position, size);
  return (
    <Rnd
      size={{ width: size.width, height: size.height }}
      position={{ x: displayPosition.x, y: displayPosition.y }}
      bounds="parent"
      dragHandleClassName="umfe-panel-header"
      cancel=".umfe-panel-actions, .umfe-panel-actions *"
      enableResizing={!minimized}
      onDragStart={onBringToFront}
      onResizeStart={onBringToFront}
      onMouseDown={onBringToFront}
      onDragStop={(_e, data) => onDragStop(data.x, data.y)}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        onResizeStop(ref.offsetWidth, ref.offsetHeight, pos.x, pos.y);
      }}
      style={{ zIndex, pointerEvents: 'auto' }}
    >
      <Box className={`umfe-panel${minimized ? ' umfe-panel-minimized' : ''}`}>
        <div className="umfe-panel-header">
          <Text size="sm" fw={600} className="umfe-panel-title">
            {title}
          </Text>
          <Group gap={6} className="umfe-panel-actions">
            {headerActions}
            <Tooltip label={dedicated ? 'Pinned window' : 'Pin window'} withArrow zIndex={PANEL_TOOLTIP_Z_INDEX}>
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={onTogglePin}
                aria-label="Pin window"
                disabled={dedicated || !onTogglePin}
              >
                {dedicated ? <IconPinned size={14} /> : <IconPinnedOff size={14} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Reset size" withArrow zIndex={PANEL_TOOLTIP_Z_INDEX}>
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={onResetSize}
                aria-label="Reset size"
              >
                <IconArrowsDiagonal size={14} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={minimized ? 'Restore window' : 'Minimize window'} withArrow zIndex={PANEL_TOOLTIP_Z_INDEX}>
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={onToggleMinimize}
                aria-label={minimized ? 'Restore window' : 'Minimize window'}
              >
                {minimized ? <IconWindowMaximize size={14} /> : <IconWindowMinimize size={14} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Close window" withArrow zIndex={PANEL_TOOLTIP_Z_INDEX}>
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={onClose}
                aria-label="Close window"
              >
                <IconX size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </div>
        <div className="umfe-panel-body">{children}</div>
      </Box>
    </Rnd>
  );
}

/**
 * Provides panel state and rendering.
 */
export function PanelsProvider({
  children,
  renderers,
  headerActions,
}: {
  children: ReactNode;
  renderers: Record<PanelType, PanelRenderer>;
  headerActions?: PanelHeaderActions;
}) {
  const [panels, setPanels] = useState<PanelInstance[]>([]);
  const [pinnedPanels, setPinnedPanels] = useState<PanelInstance[]>([]);
  const zCounter = useRef(100);

  const bringToFront = useCallback((id: string) => {
    setPanels((prev) => bringToFrontInList(prev, id, ++zCounter.current));
  }, []);

  const bringPinnedToFront = useCallback((id: string) => {
    setPinnedPanels((prev) => bringToFrontInList(prev, id, ++zCounter.current));
  }, []);

  const updatePanel = useCallback((id: string, next: Partial<PanelInstance>) => {
    setPanels((prev) => updatePanelList(prev, id, next));
  }, []);

  const updatePinnedPanel = useCallback((id: string, next: Partial<PanelInstance>) => {
    setPinnedPanels((prev) => updatePanelList(prev, id, next));
  }, []);

  const closePanel = useCallback((id: string) => {
    updatePanel(id, { open: false, dedicated: false });
  }, [updatePanel]);

  const closePinnedPanel = useCallback((id: string) => {
    setPinnedPanels((prev) => prev.filter((panel) => panel.id !== id));
  }, []);

  const closePanelsByType = useCallback((type: PanelType) => {
    setPanels((prev) => prev.map((panel) => panel.type === type ? { ...panel, open: false } : panel));
  }, []);

  const pinPanel = useCallback((id: string) => {
    setPanels((prev) => {
      const target = prev.find((panel) => panel.id === id);
      if (!target) return prev;
      setPinnedPanels((current) => [
        ...current.filter((panel) => panel.id !== target.id),
        {
          ...target,
          dedicated: true,
          open: true,
          zIndex: ++zCounter.current,
        },
      ]);
      return prev.filter((panel) => panel.id !== id);
    });
  }, []);

  const toggleMinimize = useCallback((id: string) => {
    setPanels((prev) => toggleMinimizeInList(prev, id));
  }, []);

  const togglePinnedMinimize = useCallback((id: string) => {
    setPinnedPanels((prev) => toggleMinimizeInList(prev, id));
  }, []);

  const resetPanelSize = useCallback((id: string) => {
    setPanels((prev) => resetPanelSizeInList(prev, id));
  }, []);

  const resetPinnedPanelSize = useCallback((id: string) => {
    setPinnedPanels((prev) => resetPanelSizeInList(prev, id));
  }, []);

  const openPanel = useCallback((type: PanelType, options: OpenPanelOptions) => {
    let resultId = '';
    let closedPinnedPanel = false;
    setPanels((prev) => {

      const size = options.defaultSize ?? getDefaultSize(type);
      const defaultPosition = resolveInitialPosition(type, size);

      setPinnedPanels((current) => {
        const next = current.filter((panel) => {
          if (!panel.open) return true;
          if (panel.position.x !== defaultPosition.x || panel.position.y !== defaultPosition.y) return true;
          closedPinnedPanel = true;
          return false;
        });
        return next.length === current.length ? current : next;
      });

      const closedAtDefault = prev.filter(
        (panel) => panel.type === type
          && panel.open
          && panel.position.x === defaultPosition.x
          && panel.position.y === defaultPosition.y
      );

      const nextAfterClose = closedAtDefault.length
        ? prev.map((panel) => {
          if (closedAtDefault.some((candidate) => candidate.id === panel.id)) {
            return { ...panel, open: false, dedicated: false };
          }
          return panel;
        })
        : prev;

      const reusePanelFrom = (panels: PanelInstance[], panelId: string) => {
        resultId = panelId;
        const nextZ = ++zCounter.current;
        return panels.map((panel) => {
          if (panel.id !== panelId) return panel;
          const restoreSize = panel.minimized ? (panel.expandedSize ?? panel.size) : panel.size;
          return {
            ...panel,
            open: true,
            title: options.title,
            payload: options.payload,
            minimized: false,
            expandedSize: panel.minimized ? undefined : panel.expandedSize,
            size: restoreSize,
            zIndex: nextZ,
          };
        });
      };

      const openReusable = nextAfterClose
        .filter((panel) => panel.type === type && !panel.dedicated && panel.open)
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      if (openReusable) {
        return reusePanelFrom(nextAfterClose, openReusable.id);
      }

      const reusable = nextAfterClose.find((panel) => panel.type === type && !panel.dedicated);
      if (reusable) {
        return reusePanelFrom(nextAfterClose, reusable.id);
      }

      const position = defaultPosition;
      const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newPanel: PanelInstance = {
        id,
        type,
        title: options.title,
        payload: options.payload,
        position,
        size,
        minimized: false,
        dedicated: false,
        open: true,
        zIndex: ++zCounter.current,
      };
      resultId = id;
      return [...nextAfterClose, newPanel];
     });
    if (closedPinnedPanel) {
      notifications.show({
        color: 'yellow',
        message: 'Pinned panel closed. Move it if you want to keep it open.',
      });
    }
    return resultId;
  }, []);

  const closeAllPanels = useCallback(() => {
    setPanels((prev) => (prev.length ? [] : prev));
    setPinnedPanels((prev) => (prev.length ? [] : prev));
  }, []);

  useEffect(() => {
    registerCloseAllPanels(closeAllPanels);
    return () => registerCloseAllPanels(null);
  }, [closeAllPanels]);

  const contextValue = useMemo(() => ({
    panels,
    openPanel,
    closePanel,
    closePanelsByType,
    closeAllPanels,
    toggleMinimize,
    resetPanelSize,
    bringToFront,
    updatePanel,
  }), [
    panels,
    openPanel,
    closePanel,
    closePanelsByType,
    closeAllPanels,
    toggleMinimize,
    resetPanelSize,
    bringToFront,
    updatePanel,
  ]);

  const portalRoot = typeof document !== 'undefined' ? document.body : null;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      closeAllPanels();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [closeAllPanels]);

  return (
    <PanelsContext.Provider value={contextValue}>
      {children}
      {portalRoot ? createPortal(
        <div className="umfe-panel-layer">
          {panels.filter((panel) => panel.open).map((panel) => {
            const renderer = renderers[panel.type];
            if (!renderer) return null;
            const headerAction = headerActions?.[panel.type];
            const resolvedHeaderAction = headerAction?.(panel);
            return (
              <PanelWindow
                key={panel.id}
                panel={panel}
                headerActions={resolvedHeaderAction}
                onClose={() => closePanel(panel.id)}
                onToggleMinimize={() => toggleMinimize(panel.id)}
                onResetSize={() => resetPanelSize(panel.id)}
                onTogglePin={() => pinPanel(panel.id)}
                onBringToFront={() => bringToFront(panel.id)}
                onDragStop={(x, y) => updatePanel(panel.id, { position: { x, y } })}
                onResizeStop={(width, height, x, y) => updatePanel(panel.id, { size: { width, height }, position: { x, y } })}
              >
                {renderer(panel)}
              </PanelWindow>
            );
          })}
          {pinnedPanels.filter((panel) => panel.open).map((panel) => {
            const renderer = renderers[panel.type];
            if (!renderer) return null;
            const headerAction = headerActions?.[panel.type];
            const resolvedHeaderAction = headerAction?.(panel);
            return (
              <PanelWindow
                key={panel.id}
                panel={panel}
                headerActions={resolvedHeaderAction}
                onClose={() => closePinnedPanel(panel.id)}
                onToggleMinimize={() => togglePinnedMinimize(panel.id)}
                onResetSize={() => resetPinnedPanelSize(panel.id)}
                onBringToFront={() => bringPinnedToFront(panel.id)}
                onDragStop={(x, y) => updatePinnedPanel(panel.id, { position: { x, y } })}
                onResizeStop={(width, height, x, y) => updatePinnedPanel(panel.id, { size: { width, height }, position: { x, y } })}
              >
                {renderer(panel)}
              </PanelWindow>
            );
          })}
        </div>,
        portalRoot
      ) : null}
    </PanelsContext.Provider>
  );
}
