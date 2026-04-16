/**
 * useSchemaSwitcher
 *
 * A custom React hook that manages switching between JSON schema forms.
 * It provides:
 *   - The currently selected schema and UI schema
 *   - A confirmation modal for switching/resetting schemas
 *   - Resetting form data to the initial seed
 *   - Forced remounting of the form component to ensure clean resets
 *   - A promise-based system that waits for the form to fully mount
 *
 * The hook guarantees that:
 *   • Switching to a different schema fully resets the form.
 *   • Selecting the same schema still resets the form and forces a remount.
 *   • The confirmation modal always appears before switching.
 *   • The caller can wait until the newly mounted form signals it is ready.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Button, Group, Modal, Text, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

import { requestCloseAllPanels } from '../components/Panels/Panels';
import SCHEMAREG, { DEFAULT_SCHEMA_KEY, type SchemaKey } from '../registries/schema-registry';
import INITIAL_FORM_DATA from '../registries/initial-form-data-registry';

/* -------------------------------------------------------------------------- */

type Options = {
  formDataRef: RefObject<Record<string, unknown> | null>;
  setInitialFormData: (next: Record<string, unknown>) => void;
};

export default function useSchemaSwitcher({
  formDataRef,
  setInitialFormData
}: Options) {

  // Marks the ref as intentionally used to avoid unused parameter warnings.
  // `void` evaluates the expression but discards its value.
  void formDataRef;

  /**
   * Tracks which schema is currently selected.
   */
  const [selectedSchemaKey, setSelectedSchemaKey] =
    useState<SchemaKey>(DEFAULT_SCHEMA_KEY);

  /**
   * Controls visibility of the confirmation modal.
   */
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  /**
   * Stores the schema key the user intends to switch to.
   * Applied only when the modal is confirmed.
   */
  const [pendingSchemaKey, setPendingSchemaKey] =
    useState<SchemaKey | null>(null);

  /**
   * Loading indicator for the modal’s OK button.
   */
  const [loading, setLoading] = useState(false);

  /**
   * Counter used to force React to remount the form component.
   * Required because selecting the same schema wouldn't otherwise trigger a remount.
   */
  const [formInstanceId, setFormInstanceId] = useState(0);

  /**
   * The resolved JSON schema of the currently selected schema.
   */
  const schema = useMemo(
    () => SCHEMAREG[selectedSchemaKey].schema,
    [selectedSchemaKey]
  );

  /**
   * The resolved UI schema of the currently selected schema.
   */
  const uiSchema = useMemo(
    () => SCHEMAREG[selectedSchemaKey].uischema,
    [selectedSchemaKey]
  );

  /**
   * A ref that stores a resolver function for the next form mount event.
   * When the FormShell calls `notifyFormMounted`, the promise resolves.
   */
  const mountResolveRef = useRef<null | (() => void)>(null);

  /**
   * Returns a promise that resolves when the next form mount event occurs.
   * Used to synchronize the schema-switching UI with the actual form remount.
   *
   * @returns {Promise<void>} Resolves when `notifyFormMounted` is called.
   */
  const waitForNextFormMount = useCallback(() => {
    return new Promise<void>((resolve) => {
      mountResolveRef.current = resolve;
    });
  }, []);

  /**
   * Called by the form component (FormShell) when it mounts.
   * Resolves the pending promise created by waitForNextFormMount().
   */
  const notifyFormMounted = useCallback(() => {
    if (mountResolveRef.current) {
      const resolve = mountResolveRef.current;
      mountResolveRef.current = null;
      resolve();
    }
  }, []);

  /**
   * Immediately switches or resets the schema.
   *
   * Always:
   *   - Updates selected schema
   *   - Forces a new form instance ID (to trigger remount)
   *   - Clears all form data
   *   - Waits for the form to fully mount again
   *
   * @param {SchemaKey} key - The schema key to switch to.
   */
  const selectSchemaImmediate = useCallback(
    async (key: SchemaKey, nextData?: Record<string, unknown>) => {
      requestCloseAllPanels();

      // Change schema key
      setSelectedSchemaKey(key);

      // Force remount by incrementing instance counter
      setFormInstanceId((id) => id + 1);

      const seed = typeof nextData !== 'undefined' ? nextData : INITIAL_FORM_DATA[key];
      setInitialFormData(seed);
      formDataRef.current = seed;
      // Optional UX scroll
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // Wait for the newly mounted form to report readiness
      await waitForNextFormMount();

      // Close the modal
      setConfirmOpen(false);
    },
    [formDataRef, setInitialFormData, waitForNextFormMount]
  );

  /**
   * Handler for confirming the Switch/Reset modal.
   * Triggers the schema switch and manages the modal’s loading state.
   */
  const handleConfirmOk = useCallback(async () => {
    if (!pendingSchemaKey) return;

    setLoading(true);
    await selectSchemaImmediate(pendingSchemaKey);
    setLoading(false);
    setPendingSchemaKey(null);
  }, [pendingSchemaKey, selectSchemaImmediate]);

  /**
   * Handler for canceling the confirmation modal.
   */
  const handleConfirmCancel = useCallback(() => {
    setPendingSchemaKey(null);
    setConfirmOpen(false);
  }, []);

  /**
   * Called when the user selects a schema from the UI.
   * Always requires confirmation before switching/resetting.
   *
   * @param {SchemaKey} key - The selected schema key.
   */
  const onSelectSchema = useCallback(
    (key: SchemaKey) => {
      setPendingSchemaKey(key);
      setConfirmOpen(true);
    },
    []
  );

  /**
   * Prebuilt modal JSX element used by the host UI.
   * Consumer simply renders `schemaSwitchConfirmModal` in the component tree.
   */
  const schemaSwitchConfirmModal = (
    <Modal
      opened={isConfirmOpen}
      onClose={handleConfirmCancel}
      title={
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="sm">
            <IconAlertTriangle size={16} />
          </ThemeIcon>
          <span>Switch/Reset Schema?</span>
        </Group>
      }
      closeOnClickOutside={false}
      closeOnEscape={false}
      centered
      withCloseButton={false}
    >
      <Text size="sm">
        If you switch or reset the current schema, all unsaved data will be lost.
        Do you want to continue?
      </Text>
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={handleConfirmCancel}>Cancel</Button>
        <Button color="red" loading={loading} onClick={handleConfirmOk}>Switch/Reset Schema</Button>
      </Group>
    </Modal>
  );

  /**
   * API returned by the hook.
   */
  return {
    schema,                 // Active JSON schema
    uiSchema,               // Active UI schema
    selectedSchemaKey,      // Current schema key
    onSelectSchema,         // User selects a schema → opens modal
    selectSchemaImmediate,  // Bypass modal (only used internally)
    schemaSwitchConfirmModal,
    notifyFormMounted,      // Called by FormShell on mount
    formInstanceId,         // Used by consumer to key the form component
  };
}
