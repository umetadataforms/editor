import { useCallback, useRef, useState, RefObject, ChangeEvent } from 'react';
import { Dropdown, Spin } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { MenuProps } from 'antd';
import {
  MenuOutlined,
  MenuUnfoldOutlined,
  FolderOpenOutlined,
  ExportOutlined,
  CheckOutlined,
  SaveOutlined,
  FileAddOutlined,
  SunOutlined,
  MoonOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

import ToolbarButton from './ToolbarButton';
import { jsonIO } from '../services/jsonIO/jsonIO';
import { type SaveStatus } from './Modeline';
import type { SchemaKey, RegistryEntry } from '../utils/schema-registry';
import SCHEMAREG, { DEFAULT_SCHEMA_KEY } from '../utils/schema-registry';

/* -------------------------------------------------------------------------- */

const TICK_WIDTH = 14;

type Props = {
  isDark: boolean;
  formRef: RefObject<any>;
  navOpen: boolean;
  onToggleNav: () => void;
  getFormData: () => any | null | undefined;
  fileName?: string;
  onImportJson: (data: any) => void;
  onFileNameChange: (name: string) => void;
  onStatusChange: (status: SaveStatus) => void;
  setDarkMode: (value: boolean) => void;
  selectedSchemaKey: SchemaKey;
  onSelectSchema: (k: SchemaKey) => void;
  message: MessageInstance
};

export default function ToolbarPanel({
  isDark,
  formRef,
  navOpen,
  onToggleNav,
  getFormData,
  fileName = jsonIO.DEFAULT_FILE_NAME,
  onImportJson,
  onFileNameChange,
  onStatusChange,
  setDarkMode,
  selectedSchemaKey = DEFAULT_SCHEMA_KEY,
  onSelectSchema,
  message
}: Props) {

  // Validate button handler
  const handleValidate = useCallback(() => {
    if (formRef?.current?.submit) formRef.current.submit();
    else message.warning('Validation handler not connected.');
  }, [formRef, message]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  const triggerUpload = useCallback(() => fileInputRef.current?.click(), []);

  const onFileSelected = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file) {
        try {
          setImporting(true);
          const hide = message.loading('Importing JSON…', 0);
          await new Promise(r => setTimeout(r, 300));

          try {
            const data = await jsonIO.importJsonFromFile(file);
            onImportJson(data);
            onFileNameChange?.(file.name);
            onStatusChange?.('ready');
            message.success('File imported.');
          } catch (err) {
            message.error('Import error: invalid JSON.');
          }
          hide();
        } catch (err) {
          message.error('Failed to import JSON.');
        } finally {
          setImporting(false);
        }
      }
    },
    [onImportJson, onFileNameChange, onStatusChange, message]
  );

  const currentData = useCallback(() => {
    const data = getFormData?.();
    if (data == null) {
      message.warning('No data available.');
      return null;
    }
    return data;
  }, [getFormData, message]);

  const exportMenu: MenuProps = {
    items: [
      // {
      //   key: 'json-html',
      //   label: 'JSON (HTML)',
      //   onClick: () => {
      //     const data = currentData();
      //     if (!data) return;
      //     jsonIO.exportJson(data, fileName);
      //   },
      // },
      // { type: 'divider' },
      {
        key: 'json-plain',
        label: 'JSON with Plain Text',
        onClick: () => {
          const data = currentData();
          if (!data) return;
          const ensured = fileName.replace(/\.json$/i, '') + '.json';
          jsonIO.exportJsonWithHtmlStripped(data, ensured);
        },
      }
    ],
  };

  const schemaItems: MenuProps['items'] = (
    Object.entries(SCHEMAREG) as [SchemaKey, RegistryEntry][]
  ).map(([key, entry]) => ({
    key,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Tick or phantom tick */}
        {key === selectedSchemaKey ? (
          <CheckOutlined style={{ fontSize: 12, width: TICK_WIDTH }} />
        ) : (
          <span style={{ display: 'inline-block', width: TICK_WIDTH }} />
        )}

        <span>{entry.label}</span>
      </span>
    ),
  }));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 56,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        zIndex: 11,
        cursor: importing ? 'progress' : undefined
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={onFileSelected}
      />

      <ToolbarButton
        title={isDark ? 'Light Mode' : 'Dark Mode'}
        ariaLabel="Toggle Theme"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={() => setDarkMode(!isDark)}
      />

      <Dropdown
        trigger={['click']}
        menu={{
          items: schemaItems,
          onClick: ({ key }) => onSelectSchema?.(key as SchemaKey),
        }}
      >
        <div>
          <ToolbarButton
            key="schema"
            title={SCHEMAREG[selectedSchemaKey].label}
            ariaLabel="Choose schema"
            icon={<AppstoreOutlined />}
          />
        </div>
      </Dropdown>

      <ToolbarButton
        key="toggle"
        title={navOpen ? 'Hide Navigation' : 'Show Navigation'}
        ariaLabel="Toggle navigation"
        icon={navOpen ? <MenuOutlined /> : <MenuUnfoldOutlined />}
        onClick={onToggleNav}
      />

      <ToolbarButton
        key="validate"
        title="Validate form"
        ariaLabel="Validate form"
        icon={<CheckOutlined />}
        onClick={handleValidate}
      />

      <Spin spinning={importing} size="small">
        <div>
          <ToolbarButton
            key="open"
            title={importing ? 'In progress…' : 'Import JSON'}
            ariaLabel="Import JSON"
            icon={<FolderOpenOutlined />}
            onClick={importing ? undefined : triggerUpload}
          />
        </div>
      </Spin>

      <Dropdown
        trigger={['click']}
        menu={exportMenu}
      >
        <div>
          <ToolbarButton
            key="export"
            title="Export"
            ariaLabel="Export"
            icon={<ExportOutlined />}
          />
        </div>
      </Dropdown>

      <ToolbarButton
        key="saveAs"
        title="Save As…"
        ariaLabel="Save As JSON"
        icon={<FileAddOutlined />}
        onClick={async () => {
          const data = currentData();
          if (!data) return;
          const ok = await jsonIO.saveJsonAs(data, fileName);
          if (ok) {
            const effectiveName = jsonIO.getCurrentSaveFileName(fileName);
            onFileNameChange?.(effectiveName);
            onStatusChange?.('saved');
            message.success(`Saved to "${effectiveName}".`);
          } else {
            message.error('Failed to save.');
          }
        }}
      />

      <ToolbarButton
        key="save"
        title="Save"
        ariaLabel="Save JSON"
        icon={<SaveOutlined />}
        onClick={async () => {
          const data = currentData();
          if (!data) return;
          const ok = await jsonIO.saveJson(data, fileName);
          if (ok) {
            const effectiveName = jsonIO.getCurrentSaveFileName(fileName);
            onFileNameChange?.(effectiveName);
            onStatusChange?.('saved');
            message.success(`Saved to "${effectiveName}".`);
          } else {
            message.error('Failed to save.');
          }
        }}
      />

      <div style={{ flex: '1 1 auto' }} />
    </div>
  );
}
