import { memo, useCallback, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { Box, Menu } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';

type CollapseItemKind = 'fields' | 'files' | 'variables';

/**
 * Right-click (Ctrl+click) context menu wrapper for the form.
 * Normal right-click falls through to the native menu.
 */
type ContextMenuState = {
  open: boolean;
  x: number;
  y: number;
  target?: { kind: CollapseItemKind; index: number };
  previewKey?: string;
};

type ContextMenuProps = {
  children: ReactNode;
  canCollapseItems: boolean;
  isTabularSchema: boolean;
  isTabularVcSchema: boolean;
  onToggleFieldsCollapsed: (next: boolean) => void;
  onToggleFilesCollapsed: (next: boolean) => void;
  onToggleVariablesCollapsed: (next: boolean) => void;
  onRequestCollapseItem: (kind: CollapseItemKind, index: number, action: 'collapse' | 'expand') => void;
  onOpenPreview: (key: string) => void;
  onShowMoveButtons: (next: boolean) => void;
};

/**
 * Wraps children with a context menu handler and dropdown actions.
 */
const ContextMenu = memo(function ContextMenu({
  children,
  canCollapseItems,
  isTabularSchema,
  isTabularVcSchema,
  onToggleFieldsCollapsed,
  onToggleFilesCollapsed,
  onToggleVariablesCollapsed,
  onRequestCollapseItem,
  onOpenPreview,
  onShowMoveButtons,
}: ContextMenuProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ open: false, x: 0, y: 0 });

  const handleContextMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    if (!event.ctrlKey) {
      setContextMenu((current) => ({ ...current, open: false }));
      return;
    }
    event.preventDefault();
    const target = event.target as HTMLElement | null;
    const itemNode = canCollapseItems
      ? (target?.closest?.('[data-array-item-kind]') as HTMLElement | null)
      : null;
    const kindAttr = itemNode?.getAttribute('data-array-item-kind');
    const indexAttr = itemNode?.getAttribute('data-array-item-index');
    const index = typeof indexAttr === 'string' ? Number(indexAttr) : NaN;
    const kind: CollapseItemKind | undefined = kindAttr === 'fields' || kindAttr === 'files'
      ? kindAttr
      : isTabularVcSchema && kindAttr === 'variables'
        ? 'variables'
        : undefined;
    const targetInfo = kind && Number.isFinite(index) ? { kind, index } : undefined;
    const previewKeyFromTarget = targetInfo
      ? `${targetInfo.kind}[${targetInfo.index}]`
      : undefined;
    const previewKeyFromHeader = target
      ?.closest?.('[data-preview-key]')
      ?.getAttribute?.('data-preview-key')
      ?? undefined;
    const previewNode = target?.closest?.('[id^="root_"], [id^="anchor_"]') as HTMLElement | null;
    const previewKey = previewKeyFromTarget ?? previewKeyFromHeader ?? previewNode?.id;
    setContextMenu({
      open: true,
      x: event.clientX,
      y: event.clientY,
      target: targetInfo,
      previewKey,
    });
  }, [canCollapseItems, isTabularVcSchema]);

  const closeContextMenu = useCallback(() => {
    setContextMenu((current) => ({ ...current, open: false }));
  }, []);

  return (
    <Box onContextMenu={handleContextMenu}>
      <Menu opened={contextMenu.open} onClose={closeContextMenu} withinPortal>
        <Menu.Target>
          <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, width: 1, height: 1 }} />
        </Menu.Target>
        <Menu.Dropdown>
          {isTabularSchema ? (
            <>
              <Menu trigger="hover" position="right-start" withinPortal>
                <Menu.Target>
                  <Menu.Item rightSection={<IconChevronRight size={14} />}>Fields</Menu.Item>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    onClick={() => {
                      onToggleFieldsCollapsed(true);
                      closeContextMenu();
                    }}
                  >
                    Collapse all
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => {
                      onToggleFieldsCollapsed(false);
                      closeContextMenu();
                    }}
                  >
                    Expand all
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              <Menu trigger="hover" position="right-start" withinPortal>
                <Menu.Target>
                  <Menu.Item rightSection={<IconChevronRight size={14} />}>Files</Menu.Item>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    onClick={() => {
                      onToggleFilesCollapsed(true);
                      closeContextMenu();
                    }}
                  >
                    Collapse all
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => {
                      onToggleFilesCollapsed(false);
                      closeContextMenu();
                    }}
                  >
                    Expand all
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              <Menu.Divider />
            </>
          ) : null}
          {isTabularVcSchema ? (
            <>
              <Menu trigger="hover" position="right-start" withinPortal>
                <Menu.Target>
                  <Menu.Item rightSection={<IconChevronRight size={14} />}>Variables</Menu.Item>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    onClick={() => {
                      onToggleVariablesCollapsed(true);
                      closeContextMenu();
                    }}
                  >
                    Collapse all
                  </Menu.Item>
                  <Menu.Item
                    onClick={() => {
                      onToggleVariablesCollapsed(false);
                      closeContextMenu();
                    }}
                  >
                    Expand all
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              <Menu.Divider />
            </>
          ) : null}
          <Menu trigger="hover" position="right-start" withinPortal>
            <Menu.Target>
              <Menu.Item rightSection={<IconChevronRight size={14} />}>Current item</Menu.Item>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                disabled={!contextMenu.previewKey}
                onClick={() => {
                  if (contextMenu.previewKey) {
                    onOpenPreview(contextMenu.previewKey);
                  }
                  closeContextMenu();
                }}
              >
                Preview
              </Menu.Item>
              {canCollapseItems ? (
                <>
                  <Menu.Item
                    disabled={!contextMenu.target}
                    onClick={() => {
                      if (contextMenu.target) {
                        onRequestCollapseItem(contextMenu.target.kind, contextMenu.target.index, 'collapse');
                      }
                      closeContextMenu();
                    }}
                  >
                    Collapse
                  </Menu.Item>
                  <Menu.Item
                    disabled={!contextMenu.target}
                    onClick={() => {
                      if (contextMenu.target) {
                        onRequestCollapseItem(contextMenu.target.kind, contextMenu.target.index, 'expand');
                      }
                      closeContextMenu();
                    }}
                  >
                    Expand
                  </Menu.Item>
                </>
              ) : null}
            </Menu.Dropdown>
          </Menu>
          <Menu trigger="hover" position="right-start" withinPortal>
            <Menu.Target>
              <Menu.Item rightSection={<IconChevronRight size={14} />}>Move buttons</Menu.Item>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                onClick={() => {
                  onShowMoveButtons(true);
                  closeContextMenu();
                }}
              >
                Show
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  onShowMoveButtons(false);
                  closeContextMenu();
                }}
              >
                Hide
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Menu.Dropdown>
      </Menu>
      {children}
    </Box>
  );
});

export default ContextMenu;
