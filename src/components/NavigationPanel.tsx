import { useDeferredValue, useState, useCallback, useMemo, useRef } from 'react';
import type { MouseEvent, RefObject } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import {
  Box,
  Button,
  Group,
  Mark,
  Modal,
  NavLink,
  ScrollArea,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { schemaToNavigationItems } from '../utils/navigation-items';
import { isTabularSchemaId, isTabularVcSchemaId } from '../utils/tabular-schema-ids';
import type { CollapseController } from '../types/collapse-controller';
import type { ItemReorderController } from '../types/item-reorder-controller';
import type { TabularPager } from '../types/tabular-pager';

/* -------------------------------------------------------------------------- */

type NavigationPanelProps = {
  schema: RJSFSchema;
  initialFieldKey?: string;
  navOpen: boolean;
  navFormData?: Record<string, unknown> | null;
  tabularPagerRef?: RefObject<TabularPager | null>;
  collapseControllerRef?: RefObject<CollapseController | null>;
  itemReorderRef?: RefObject<ItemReorderController | null>;
  onNavDataRefresh?: (data?: Record<string, unknown>) => void;
};

/**
 * Side navigation panel for top-level schema fields with search and anchors.
 */
export default function NavigationPanel({
  schema,
  initialFieldKey,
  navOpen,
  navFormData,
  tabularPagerRef,
  collapseControllerRef,
  itemReorderRef,
  onNavDataRefresh,
}: NavigationPanelProps) {

  const items = useMemo(() => schemaToNavigationItems(schema), [schema]);
  const tabularSchema = isTabularSchemaId(schema?.$id);
  const tabularVcSchema = isTabularVcSchemaId(schema?.$id);

  const [selectedField, setSelectedField] = useState<string>(
    initialFieldKey ?? items[0]?.key ?? ''
  );
  const [query, setQuery] = useState<string>('');
  const deferredQuery = useDeferredValue(query);
  const [navWidth, setNavWidth] = useState(280);
  const navRef = useRef<HTMLDivElement | null>(null);
  const moveInputRef = useRef<HTMLInputElement | null>(null);
  const [moveTarget, setMoveTarget] = useState<
    { kind: 'fields' | 'variables'; index: number; label: string } | null
  >(null);

  const handleResizeEnd = useCallback(() => {
    if (!navRef.current) return;
    const nextWidth = navRef.current.offsetWidth;
    if (nextWidth > 0 && nextWidth !== navWidth) setNavWidth(nextWidth);
  }, [navWidth]);

  const scrollToAnchor = useCallback((key: string) => {
    const el = document.getElementById(`anchor_${key}`);
    if (!el) return;

    const offset = 20;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top: y, behavior: 'smooth' });
    setSelectedField(key);
  }, []);

  const visibleItems = useMemo(() => {
    if (!deferredQuery) return items;
    const q = deferredQuery.toLowerCase();
    return items.filter(({ title, key }) => {
      const titleLower = title.toLowerCase();
      const keyLower = key.toLowerCase();
      return titleLower.includes(q) || keyLower.includes(q);
    });
  }, [items, deferredQuery]);

  const navData = navFormData as
    | { fields?: Array<Record<string, unknown>>; variables?: Array<Record<string, unknown>> }
    | null
    | undefined;
  const fieldsData = Array.isArray(navData?.fields) ? navData.fields : null;
  const variablesData = Array.isArray(navData?.variables) ? navData.variables : null;

  const itemTotals = useMemo(() => ({
    fields: fieldsData ? fieldsData.length : 0,
    variables: variablesData ? variablesData.length : 0,
  }), [fieldsData, variablesData]);

  const itemIndex = useMemo(() => {
    if (tabularSchema) {
      const fields = fieldsData ?? [];
      return fields
        .map((item, index) => ({
          label: typeof item?.label === 'string' ? item.label.trim() : '',
          kind: 'fields' as const,
          index,
        }))
        .filter((item) => item.label.length > 0);
    }
    if (tabularVcSchema) {
      const variables = variablesData ?? [];
      return variables
        .map((item, index) => ({
          label: typeof item?.label === 'string' ? item.label.trim() : '',
          kind: 'variables' as const,
          index,
        }))
        .filter((item) => item.label.length > 0);
    }
    return [] as Array<{ label: string; kind: 'fields' | 'variables'; index: number }>;
  }, [fieldsData, tabularSchema, tabularVcSchema, variablesData]);

  const showItemIndex = tabularSchema || tabularVcSchema;

  const visibleItemIndex = useMemo(() => {
    if (!deferredQuery) return itemIndex;
    const q = deferredQuery.toLowerCase();
    return itemIndex.filter(({ label }) => label.toLowerCase().includes(q));
  }, [itemIndex, deferredQuery]);

  const handleItemClick = useCallback((item: { kind: 'fields' | 'variables'; index: number }) => {
    const pager = tabularPagerRef?.current;
    const kind = item.kind;
    const pageSize = pager?.pageSize ?? 0;
    const page = pager ? Math.max(0, Math.floor(item.index / pageSize)) : 0;
    const collapseController = collapseControllerRef?.current;

    const applyCollapsedState = () => {
      collapseController?.setInstantCollapse(true);
      collapseController?.collapseAll(kind);
    };

    if (!pager) {
      applyCollapsedState();
      requestAnimationFrame(() => {
        collapseController?.setInstantCollapse(false);
      });
      return;
    }

    const isFieldsItem = kind === 'fields' && pager.isTabularSchema;
    const isVariablesItem = kind === 'variables' && pager.isTabularVcSchema;
    if (!isFieldsItem && !isVariablesItem) {
      applyCollapsedState();
      requestAnimationFrame(() => {
        collapseController?.setInstantCollapse(false);
      });
      return;
    }

    applyCollapsedState();
    pager.setTabularPage(kind, page);
    requestAnimationFrame(() => {
      collapseController?.setInstantCollapse(false);
    });
  }, [collapseControllerRef, tabularPagerRef]);

  const handleMoveClick = useCallback((
    event: MouseEvent<HTMLButtonElement>,
    item: { kind: 'fields' | 'variables'; index: number; label: string }
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setMoveTarget(item);
  }, []);

  const handleMoveClose = useCallback(() => {
    setMoveTarget(null);
  }, []);

  const handleMoveSubmit = useCallback(() => {
    if (!moveTarget) return;
    const total = moveTarget.kind === 'fields' ? itemTotals.fields : itemTotals.variables;
    const rawValue = moveInputRef.current?.value ?? '';
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric) || total <= 0) {
      return;
    }
    const toIndex = Math.max(1, Math.min(Math.floor(numeric), total)) - 1;
    itemReorderRef?.current?.moveItem(moveTarget.kind, moveTarget.index, toIndex);
    onNavDataRefresh?.();
    handleMoveClose();
  }, [handleMoveClose, itemReorderRef, itemTotals, moveTarget, onNavDataRefresh]);

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const lowerText = text.toLowerCase();
    const lowerQ = q.toLowerCase();
    const idx = lowerText.indexOf(lowerQ);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);
    return (
      <span>
        {before}
        <Mark color="yellow">
          {match}
        </Mark>
        {after}
      </span>
    );
  };

  return (
    <Box
      ref={navRef}
      onPointerUp={handleResizeEnd}
      onPointerCancel={handleResizeEnd}
      style={{
        width: navOpen ? navWidth : 0,
        minWidth: navOpen ? 220 : 0,
        maxWidth: navOpen ? 520 : 0,
        position: 'fixed',
        top: 0,
        left: 56,
        height: '100vh',
        overflow: 'hidden',
        resize: navOpen ? 'horizontal' : 'none',
        zIndex: 10,
        borderRight: navOpen ? '1px solid var(--mantine-color-default-border)' : 'none',
        background: 'var(--mantine-color-body)',
        transition: 'width 160ms ease',
      }}
    >
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          opacity: navOpen ? 1 : 0,
          transition: 'opacity 120ms ease',
          pointerEvents: navOpen ? 'auto' : 'none',
        }}
      >
        <Box style={{ padding: 16 }}>
          <Text id="field-search-label" fw={600} size="sm" mb={8}>
            Fields
          </Text>
          <TextInput
            size="xs"
            placeholder="Search fields…"
            aria-labelledby="field-search-label"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const first = visibleItems[0];
                if (first) {
                  scrollToAnchor(first.key);
                  return;
                }
                const firstItem = visibleItemIndex[0];
                if (firstItem) handleItemClick(firstItem);
              }
            }}
          />
        </Box>

        <ScrollArea style={{ flex: 1, paddingBottom: 32 }}>
          <Box px={8} pb={8}>
            {visibleItems.length === 0 ? (
              <Text size="sm" c="dimmed" style={{ padding: 8 }}>
                No matching fields
              </Text>
            ) : (
              visibleItems.map(({ key, title }) => (
                <NavLink
                  key={key}
                  label={highlight(title, deferredQuery)}
                  active={selectedField === key}
                  onClick={() => scrollToAnchor(String(key))}
                  variant="light"
                  styles={{
                    label: { whiteSpace: 'normal' },
                    root: { borderRadius: 6 },
                  }}
                />
              ))
            )}
          </Box>
          {showItemIndex ? (
            <Box px={8} pb={8}>
              {visibleItemIndex.length === 0 ? (
                <Text size="sm" c="dimmed" style={{ padding: 8 }}>
                  No matching items
                </Text>
              ) : (
                visibleItemIndex.map(({ label, kind, index }) => (
                  <NavLink
                    key={`${kind}-${index}`}
                    label={(
                      <Group gap="xs" justify="space-between" wrap="nowrap">
                        <Text
                          size="sm"
                          title={label}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {index}. {highlight(label, deferredQuery)}
                        </Text>
                        <Tooltip label="Move item" withArrow>
                          <Button
                            size="xs"
                            variant="light"
                            px={6}
                            aria-label="Move item"
                            onClick={(event) => handleMoveClick(event, { kind, index, label })}
                          >
                            M
                          </Button>
                        </Tooltip>
                      </Group>
                    )}
                    onClick={() => handleItemClick({ kind, index })}
                    variant="light"
                    styles={{
                      label: { whiteSpace: 'normal' },
                      root: { borderRadius: 6, paddingLeft: 16 },
                    }}
                  />
                ))
              )}
            </Box>
          ) : null}
        </ScrollArea>
      </Box>
      <Modal
        opened={Boolean(moveTarget)}
        onClose={handleMoveClose}
        title={moveTarget ? `Move ${moveTarget.label}` : 'Move item'}
        centered
        trapFocus
      >
        <TextInput
          key={moveTarget ? `${moveTarget.kind}-${moveTarget.index}` : 'move-input'}
          label="New position"
          defaultValue=""
          ref={moveInputRef}
          autoFocus
          inputMode="numeric"
          placeholder={moveTarget
            ? `1 - ${moveTarget.kind === 'fields' ? itemTotals.fields : itemTotals.variables}`
            : '1'}
        />
        <Group mt="md" justify="flex-end">
          <Button variant="default" onClick={handleMoveClose}>Cancel</Button>
          <Button onClick={handleMoveSubmit}>Move</Button>
        </Group>
      </Modal>
    </Box>
  );
}
