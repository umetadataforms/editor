import { useCallback, useRef, useState } from 'react';
import type { RefObject, ChangeEvent } from 'react';
import { Menu, useMantineColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconApps,
  IconCheck,
  IconChevronRight,
  IconDeviceFloppy,
  IconFileExport,
  IconFileImport,
  IconFilePlus,
  IconFileText,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMoon,
  IconSun,
  IconTable,
} from '@tabler/icons-react';

import ToolbarButton from './ToolbarButton';
import { jsonIO } from '../services/jsonIO/jsonIO';
import { type SaveStatus } from './Modeline';
import type { SchemaKey, RegistryEntry } from '../registries/schema-registry';
import SCHEMAREG, { DEFAULT_SCHEMA_KEY } from '../registries/schema-registry';
import EXAMPLESREG from '../registries/example-registry';
import type { Example } from '../registries/example-registry';

/* -------------------------------------------------------------------------- */

const TICK_WIDTH = 14;
const ICON_SIZE = 25;
type FormData = Record<string, unknown>;
const EXAMPLE_TOP_MENU_STYLE = { width: 'max-content' } as const;
const EXAMPLE_MENU_STYLE = { width: 'max-content', minWidth: 280 } as const;

const REAL_DATASET_KEYS: SchemaKey[] = [
  'https://github.com/umetadataforms/schemas/raw/main/modular/real-dataset-metadata/v0.0.2.json',
  'dataset-metadata-schema-real.json',
];

const TABULAR_DATASET_KEYS: SchemaKey[] = [
  'https://github.com/umetadataforms/schemas/raw/main/modular/tabular-data-metadata/v0.0.2.json',
  'tabular-data-metadata-schema.json',
];


type Props = {
  formRef: RefObject<{ submit?: () => void } | null>;
  navOpen: boolean;
  onToggleNav: () => void;
  getFormData: () => FormData | null | undefined;
  fileName?: string;
  onImportJson: (data: FormData) => Promise<void>;
  onFileNameChange: (name: string) => void;
  onSaveStatusChange: (status: SaveStatus) => void;
  selectedSchemaKey: SchemaKey;
  onSelectSchema: (k: SchemaKey) => void;
  onGenerateFromFile: (format: 'v0.0.2' | 'vc') => void;
  isGeneratingFromFile: boolean;
  onValidateFull?: () => void;
};

/**
 * Left rail toolbar with schema selection, import/export, and validation actions.
 */
export default function ToolbarPanel({
  formRef,
  navOpen,
  onToggleNav,
  getFormData,
  fileName = jsonIO.DEFAULT_FILE_NAME,
  onImportJson,
  onFileNameChange,
  onSaveStatusChange,
  selectedSchemaKey = DEFAULT_SCHEMA_KEY,
  onSelectSchema,
  onGenerateFromFile,
  isGeneratingFromFile,
  onValidateFull,
}: Props) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // Validate button handler
  const handleValidate = useCallback(() => {
    if (onValidateFull) {
      onValidateFull();
      return;
    }
    if (formRef?.current?.submit) formRef.current.submit();
    else notifications.show({ color: 'yellow', message: 'Validation handler not connected.' });
  }, [formRef, onValidateFull]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);

  const triggerUpload = useCallback(() => fileInputRef.current?.click(), []);

  const onFileSelected = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file) {
        try {
          setImporting(true);
          const id = `import-${Date.now()}`;
          notifications.show({
            id,
            message: 'Importing JSON…',
            loading: true,
            autoClose: false,
            withCloseButton: false,
          });
          await new Promise(r => setTimeout(r, 300));

          try {
          const data = await jsonIO.importJsonFromFile(file);
          await onImportJson(data);
          onFileNameChange?.(file.name);
          onSaveStatusChange?.('ready');
          notifications.show({ color: 'green', message: 'File imported.' });
          } catch {
            notifications.show({ color: 'red', message: 'Import error: invalid JSON.' });
          }
          notifications.hide(id);
        } catch {
          notifications.show({ color: 'red', message: 'Failed to import JSON.' });
        } finally {
          setImporting(false);
        }
      }
    },
    [onImportJson, onFileNameChange, onSaveStatusChange]
  );

  const currentData = useCallback(() => {
    const data = getFormData?.();
    if (data == null) {
      notifications.show({ color: 'yellow', message: 'No data available.' });
      return null;
    }
    return data;
  }, [getFormData]);

  const handleLoadExample = useCallback(
    async (example: Example) => {
      setLoadingExample(true);
      try {
        const cloned = typeof structuredClone === 'function'
          ? structuredClone(example.data)
          : JSON.parse(JSON.stringify(example.data)) as Record<string, unknown>;
        await onImportJson(cloned);
        onFileNameChange?.(`${example.key}.json`);
        onSaveStatusChange?.('ready');
        notifications.show({ color: 'green', message: `Loaded example: ${example.label}.` });
      } catch {
        notifications.show({ color: 'red', message: 'Failed to load example.' });
      } finally {
        setLoadingExample(false);
      }
    },
    [onImportJson, onFileNameChange, onSaveStatusChange]
  );

  const schemaItems = (
    Object.entries(SCHEMAREG) as [SchemaKey, RegistryEntry][]
  ).map(([key, entry]) => ({
    key,
    label: entry.label,
    selected: key === selectedSchemaKey,
  }));

  const realExamples = REAL_DATASET_KEYS.flatMap(
    (key) => (EXAMPLESREG as Record<SchemaKey, Example[]>)[key] ?? []
  );
  const tabularExamples = TABULAR_DATASET_KEYS.flatMap(
    (key) => (EXAMPLESREG as Record<SchemaKey, Example[]>)[key] ?? []
  );

  const renderExampleItems = (items: Example[], disabled: boolean) => (
    items.length === 0
      ? <Menu.Item disabled>No examples available</Menu.Item>
      : items.map((example) => (
        <Menu.Item
          key={example.key}
          onClick={() => handleLoadExample(example)}
          disabled={disabled}
          title={example.label}
        >
          <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {example.label}
          </span>
        </Menu.Item>
      ))
  );

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
        cursor: importing || isGeneratingFromFile ? 'progress' : undefined
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
        icon={isDark ? <IconSun size={ICON_SIZE} /> : <IconMoon size={ICON_SIZE} />}
        onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
      />

      <Menu position="right-start" shadow="md">
        <Menu.Target>
          <div>
            <ToolbarButton
              key="schema"
              title="Choose schema"
              ariaLabel="Choose schema"
              icon={<IconApps size={ICON_SIZE} />}
            />
          </div>
        </Menu.Target>
        <Menu.Dropdown style={{ width: 'max-content' }}>
          {schemaItems.map((item) => (
            <Menu.Item
              key={item.key}
              leftSection={
                item.selected ? (
                  <IconCheck size={14} />
                ) : (
                  <span style={{ display: 'inline-block', width: TICK_WIDTH }} />
                )
              }
              onClick={() => onSelectSchema?.(item.key as SchemaKey)}
            >
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      <ToolbarButton
        key="toggle"
        title={navOpen ? 'Hide Navigation' : 'Show Navigation'}
        ariaLabel="Toggle navigation"
        icon={navOpen ? <IconLayoutSidebarLeftCollapse size={ICON_SIZE} /> : <IconLayoutSidebarLeftExpand size={ICON_SIZE} />}
        onClick={onToggleNav}
      />

      <ToolbarButton
        key="validate"
        title="Validate form"
        ariaLabel="Validate form"
        icon={<IconCheck size={ICON_SIZE} />}
        onClick={handleValidate}
      />

      <Menu position="right-start" shadow="md">
        <Menu.Target>
          <div>
            <ToolbarButton
              key="loadExample"
              title="Load example"
              ariaLabel="Load example"
              icon={<IconFileText size={ICON_SIZE} />}
              loading={loadingExample}
              disabled={loadingExample}
            />
          </div>
        </Menu.Target>
        <Menu.Dropdown style={EXAMPLE_TOP_MENU_STYLE}>
          <Menu trigger="hover" position="right-start" withinPortal shadow="md">
            <Menu.Target>
              <Menu.Item rightSection={<IconChevronRight size={14} />}>
                Real dataset metadata
              </Menu.Item>
            </Menu.Target>
            <Menu.Dropdown style={EXAMPLE_MENU_STYLE}>
              {renderExampleItems(realExamples, loadingExample)}
            </Menu.Dropdown>
          </Menu>
          <Menu trigger="hover" position="right-start" withinPortal shadow="md">
            <Menu.Target>
              <Menu.Item rightSection={<IconChevronRight size={14} />}>
                Tabular dataset metadata
              </Menu.Item>
            </Menu.Target>
            <Menu.Dropdown style={EXAMPLE_MENU_STYLE}>
              {renderExampleItems(tabularExamples, loadingExample)}
            </Menu.Dropdown>
          </Menu>
        </Menu.Dropdown>
      </Menu>

      <Menu position="right-start" shadow="md">
        <Menu.Target>
          <div>
            <ToolbarButton
              key="generate"
              title={isGeneratingFromFile ? 'Generating…' : 'Generate from file'}
              ariaLabel="Generate from file"
              icon={<IconTable size={ICON_SIZE} />}
              loading={isGeneratingFromFile}
              disabled={isGeneratingFromFile}
            />
          </div>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            onClick={() => onGenerateFromFile('v0.0.2')}
            disabled={isGeneratingFromFile}
          >
            Generate from tabular data file (v0.0.2)
          </Menu.Item>
          <Menu.Item
            onClick={() => onGenerateFromFile('vc')}
            disabled={isGeneratingFromFile}
          >
            Generate from tabular data file (AISym4Med)
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <div>
        <ToolbarButton
          key="open"
          title={importing ? 'In progress…' : 'Import JSON'}
          ariaLabel="Import JSON"
          icon={<IconFileImport size={ICON_SIZE} />}
          onClick={importing ? undefined : triggerUpload}
          loading={importing}
          disabled={importing}
        />
      </div>

      <Menu position="right-start" shadow="md" width={220}>
        <Menu.Target>
          <div>
            <ToolbarButton
              key="export"
              title="Export"
              ariaLabel="Export"
              icon={<IconFileExport size={ICON_SIZE} />}
            />
          </div>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            onClick={() => {
              const data = currentData();
              if (!data) return;
              const ensured = fileName.replace(/\.json$/i, '') + '.json';
              jsonIO.exportJsonWithHtmlStripped(data, ensured);
            }}
          >
            JSON with Plain Text
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <ToolbarButton
        key="saveAs"
        title="Save As…"
        ariaLabel="Save As JSON"
        icon={<IconFilePlus size={ICON_SIZE} />}
        onClick={async () => {
          const data = currentData();
          if (!data) return;
          const ok = await jsonIO.saveJsonAs(data, fileName);
          if (ok) {
            const effectiveName = jsonIO.getCurrentSaveFileName(fileName);
            onFileNameChange?.(effectiveName);
            onSaveStatusChange?.('saved');
            notifications.show({ color: 'green', message: `Saved to "${effectiveName}".` });
          } else {
            notifications.show({ color: 'red', message: 'Failed to save.' });
          }
        }}
      />

      <ToolbarButton
        key="save"
        title="Save"
        ariaLabel="Save JSON"
        icon={<IconDeviceFloppy size={ICON_SIZE} />}
        onClick={async () => {
          const data = currentData();
          if (!data) return;
          const ok = await jsonIO.saveJson(data, fileName);
          if (ok) {
            const effectiveName = jsonIO.getCurrentSaveFileName(fileName);
            onFileNameChange?.(effectiveName);
            onSaveStatusChange?.('saved');
            notifications.show({ color: 'green', message: `Saved to "${effectiveName}".` });
          } else {
            notifications.show({ color: 'red', message: 'Failed to save.' });
          }
        }}
      />

      <div style={{ flex: '1 1 auto' }} />
    </div>
  );
}
