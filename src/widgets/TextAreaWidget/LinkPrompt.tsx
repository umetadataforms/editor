import { useState, useRef, useCallback } from 'react';
import { Modal, Input, Form } from 'antd';
import type { InputRef } from 'antd';

type Initial = { url?: string; title?: string };
type Result = { url: string; title: string } | null;

export default function LinkPrompt() {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<Initial>({ url: '', title: '' });
  const resolverRef = useRef<(v: Result) => void>(() => {});
  const [form] = Form.useForm();

  const urlFocusRef = useRef<InputRef>(null);
  const titleFocusRef = useRef<InputRef>(null);

  const ask = useCallback((init: Initial = {}) => {
    setInitial({ url: init.url ?? '', title: init.title ?? '' });
    form.setFieldsValue({ url: init.url ?? '', title: init.title ?? '' });
    setOpen(true);
    return new Promise<Result>((resolve) => {
      resolverRef.current = resolve;
    });
  }, [form]);

  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setOpen(false);
      resolverRef.current(values as { url: string; title: string });
    } catch {
      // keep open
    }
  }, [form]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolverRef.current(null);
  }, []);

  const handleFormKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFormElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleOk();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleOk, handleCancel]
  );

  const modal = (
    <Modal
      open={open}
      title="Insert/Edit Link"
      okText="OK"
      cancelText="Cancel"
      onOk={handleOk}
      onCancel={handleCancel}
      afterClose={() => form.resetFields()}
      keyboard
      closable={false}
      maskClosable={false}
      afterOpenChange={(opened) => {
        if (!opened) return;
        // Read live values from the form, not from `initial`
        const { url = '', title = '' } = form.getFieldsValue(['url', 'title']) as {
          url?: string; title?: string;
        };
        const urlHas = !!url?.trim();
        const titleHas = !!title?.trim();

        // If both same (both empty or both filled) → focus URL; else focus the empty one
        const focusUrl = urlHas === titleHas ? true : !urlHas;
        const target = focusUrl ? urlFocusRef.current : titleFocusRef.current;

        // Allow the DOM to settle before focusing
        requestAnimationFrame(() => {
          // AntD InputRef exposes .focus(); this covers both Input and legacy wrappers
          target?.focus?.();
        });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ url: initial.url ?? '', title: initial.title ?? '' }}
        onKeyDown={handleFormKeyDown}
      >
        <Form.Item
          name="url"
          label="URL"
          rules={[{ required: true, message: 'Please enter a URL' }]}
        >
          <Input ref={urlFocusRef} placeholder="https://example.com" />
        </Form.Item>
        <Form.Item name="title" label="Title (optional)">
          <Input ref={titleFocusRef} placeholder="Visible Label" />
        </Form.Item>
      </Form>
    </Modal>
  );

  return [ask, modal] as const;
}
