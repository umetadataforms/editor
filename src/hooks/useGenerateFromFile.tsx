import { useCallback, useMemo, useState } from 'react';

import { Button, Group, Modal, Text, ThemeIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle } from '@tabler/icons-react';

import type { FormData } from '../components/FormShell';
import type { SaveStatus } from '../components/Modeline';

type PendingGenerated = {
  data: Record<string, unknown>;
  fileName: string;
  sourcePath: string;
};

type GenerateFromFileOptions = {
  onImportJson: (data: FormData) => Promise<void>;
  onFileNameChange: (name: string) => void;
  onSaveStatusChange: (status: SaveStatus) => void;
};

/**
 * Manages the "generate from file" flow and confirmation modal.
 */
export default function useGenerateFromFile({
  onImportJson,
  onFileNameChange,
  onSaveStatusChange,
}: GenerateFromFileOptions) {
  const [isGeneratingFromFile, setGeneratingFromFile] = useState(false);
  const [applyGeneratedLoading, setApplyGeneratedLoading] = useState(false);
  const [pendingGenerated, setPendingGenerated] = useState<PendingGenerated | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const handleGenerateFromFile = useCallback(async (format: 'v0.0.2' | 'vc') => {
    if (!window.umfe?.selectTabularFile || !window.umfe?.generateTabularMetadata) {
      notifications.show({
        color: 'yellow',
        message: 'Generate from file is only available in the Electron app.',
      });
      return;
    }

    setGeneratingFromFile(true);
    try {
      const selection = await window.umfe.selectTabularFile();
      if (selection.canceled || !selection.filePath) return;

      const result = await window.umfe.generateTabularMetadata({
        filePath: selection.filePath,
        format,
      });
      if (!result?.data) {
        throw new Error('missing-generated-data');
      }

      setPendingGenerated({
        data: result.data,
        fileName: result.fileName,
        sourcePath: result.sourcePath,
      });
      setGenerateModalOpen(true);
    } catch (error) {
      console.error(error);
      notifications.show({ color: 'red', message: 'Failed to generate metadata from file.' });
    } finally {
      setGeneratingFromFile(false);
    }
  }, []);

  const handleCancelGenerated = useCallback(() => {
    setGenerateModalOpen(false);
    setPendingGenerated(null);
  }, []);

  const handleApplyGenerated = useCallback(async () => {
    if (!pendingGenerated) return;

    setApplyGeneratedLoading(true);
    try {
      await onImportJson(pendingGenerated.data as FormData);
      setGenerateModalOpen(false);
      setPendingGenerated(null);

      onFileNameChange(pendingGenerated.fileName);
      onSaveStatusChange('ready');

      notifications.show({ color: 'green', message: 'Generated metadata loaded.' });
    } catch (error) {
      console.error(error);
      notifications.show({ color: 'red', message: 'Failed to apply generated metadata.' });
    } finally {
      setApplyGeneratedLoading(false);
    }
  }, [onFileNameChange, onImportJson, onSaveStatusChange, pendingGenerated]);

  const generateConfirmModal = useMemo(() => (
    <Modal
      opened={generateModalOpen}
      onClose={handleCancelGenerated}
      title={
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="sm">
            <IconAlertTriangle size={16} />
          </ThemeIcon>
          <span>Replace metadata?</span>
        </Group>
      }
      closeOnClickOutside={false}
      closeOnEscape={false}
      centered
      withCloseButton={false}
    >
      <Text size="sm">
        This will replace the current form data and switch to the tabular schema.
        Do you want to continue?
      </Text>
      {pendingGenerated?.fileName ? (
        <Text size="xs" mt="xs" c="dimmed">
          Generated from: {pendingGenerated.fileName}
        </Text>
      ) : null}
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={handleCancelGenerated}>Cancel</Button>
        <Button color="red" loading={applyGeneratedLoading} onClick={handleApplyGenerated}>
          Replace Data
        </Button>
      </Group>
    </Modal>
  ), [
    applyGeneratedLoading,
    generateModalOpen,
    handleApplyGenerated,
    handleCancelGenerated,
    pendingGenerated?.fileName,
  ]);

  return {
    generateConfirmModal,
    handleGenerateFromFile,
    isGeneratingFromFile,
  };
}
