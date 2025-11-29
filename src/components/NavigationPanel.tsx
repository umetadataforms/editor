import { useState, useCallback, useMemo, useEffect } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { Layout, Menu, Input, theme } from 'antd';
import { schemaToNavigationItems } from '../utils/navigation-items';

/* -------------------------------------------------------------------------- */

const { Sider } = Layout;

type NavigationPanelProps = {
  schema: RJSFSchema;
  initialFieldKey?: string;
  navOpen: boolean;
};

export default function NavigationPanel({
  schema,
  initialFieldKey,
  navOpen
}: NavigationPanelProps) {

  const { token } = theme.useToken();

  const items = useMemo(() => schemaToNavigationItems(schema), [schema]);

  const [selectedField, setSelectedField] = useState<string>(
    initialFieldKey ?? items[0]?.key ?? ''
  );
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    setSelectedField(initialFieldKey ?? items[0]?.key ?? '');
    setQuery('');
  }, [schema, items, initialFieldKey]);

  const scrollToAnchor = useCallback((key: string) => {
    const el = document.getElementById(`anchor_${key}`);
    if (!el) return;

    const offset = 20;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top: y, behavior: 'smooth' });
    setSelectedField(key);
  }, []);

  // const scrollToAnchor = useCallback((key: string) => {
  //   const el = document.getElementById(`anchor_${key}`);
  //   if (el) {
  //     el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //     setSelectedField(key);
  //   }
  // }, []);

  const visibleItems = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(({ title, key }) => {
      const titleLower = title.toLowerCase();
      const keyLower = key.toLowerCase();
      return titleLower.includes(q) || keyLower.includes(q);
    });
  }, [items, query]);

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
        <mark
          style={{
            backgroundColor: token.colorHighlight,
            color: token.colorText
          }}
        >
          {match}
        </mark>
        {after}
      </span>
    );
  };

  return (
    <Sider
      width={280}
      collapsedWidth={0}
      collapsed={!navOpen}
      trigger={null}
      style={{
        background: token.colorBgContainer,
        position: 'fixed',
        top: 0,
        left: 56,
        height: '100vh',
        overflow: 'hidden',
        zIndex: 10,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: token.colorBgContainer,
        }}
      >
        <div style={{ padding: 16 }}>
          <div
            id="field-search-label"
            style={{ fontWeight: 600, marginBottom: 8 }}
          >
            Fields
          </div>
          <Input
            size="small"
            placeholder="Search fields…"
            allowClear
            aria-labelledby="field-search-label"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={() => {
              const first = visibleItems[0];
              if (first) scrollToAnchor(first.key);
            }}
          />
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          paddingBottom: 32
        }}
        >
          {visibleItems.length === 0 ? (
            <div style={{ padding: 16, color: token.colorTextSecondary }}>
              No matching fields
            </div>
          ) : (
            <Menu
              mode="inline"
              selectedKeys={[selectedField]}
              onClick={({ key }) => scrollToAnchor(String(key))}
              items={visibleItems.map(({ key, title }) => ({
                key,
                label: highlight(title, query),
                title,
              }))}
            />
          )}
        </div>
      </div>
    </Sider>
  );
}
