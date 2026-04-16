import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Group, Modal, TextInput } from '@mantine/core';

type Initial = { url?: string; title?: string };
type Result = { url: string; title: string } | null;

export default function LinkPrompt() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Required<Initial>>({ url: '', title: '' });
  const [urlError, setUrlError] = useState<string | null>(null);

  const resolverRef = useRef<(v: Result) => void>(() => {});
  const urlFocusRef = useRef<HTMLInputElement>(null);
  const titleFocusRef = useRef<HTMLInputElement>(null);

  const ask = useCallback((init: Initial = {}) => {
    const next = { url: init.url ?? '', title: init.title ?? '' };
    setValues(next);
    setUrlError(null);
    setOpen(true);
    return new Promise<Result>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleOk = useCallback(() => {
    const url = values.url.trim();
    if (!url) {
      setUrlError('Please enter a URL');
      return;
    }
    setOpen(false);
    resolverRef.current({ url, title: values.title.trim() });
  }, [values]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolverRef.current(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleOk();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleOk, handleCancel]
  );

  useEffect(() => {
    if (!open) return;
    const urlHas = !!values.url.trim();
    const titleHas = !!values.title.trim();
    const focusUrl = urlHas === titleHas ? true : !urlHas;
    const target = focusUrl ? urlFocusRef.current : titleFocusRef.current;
    requestAnimationFrame(() => target?.focus());
  }, [open, values]);

  const modal = (
    <Modal
      opened={open}
      onClose={handleCancel}
      title="Insert/Edit Link"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
    >
      <div onKeyDown={handleKeyDown}>
        <TextInput
          ref={urlFocusRef}
          label="URL"
          placeholder="https://example.com"
          value={values.url}
          error={urlError}
          onChange={(e) => {
            setUrlError(null);
            setValues((prev) => ({ ...prev, url: e.currentTarget.value }));
          }}
          required
        />
        <TextInput
          ref={titleFocusRef}
          mt="sm"
          label="Title (optional)"
          placeholder="Visible Label"
          value={values.title}
          onChange={(e) => setValues((prev) => ({ ...prev, title: e.currentTarget.value }))}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleOk}>OK</Button>
        </Group>
      </div>
    </Modal>
  );

  return [ask, modal] as const;
}
