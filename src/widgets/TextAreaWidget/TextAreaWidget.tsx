import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getMarkRange } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

import { Button, Select, Tooltip, Divider, Space, theme } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  CodeOutlined,
  LinkOutlined,
  ClearOutlined,
  DoubleRightOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

import LinkPrompt from './LinkPrompt';

const { useToken } = theme;

/* -----------------------------------------------------------------------------
 * Toolbar
 * -------------------------------------------------------------------------- */

const Toolbar = memo(function Toolbar(
  { editor, disabled }: { editor: any; disabled?: boolean }
) {
  const { token } = useToken();
  const [askLink, linkModal] = LinkPrompt();

  const [uiState, setUiState] = useState({
    heading: 'normal',
    bold: false,
    italic: false,
    underline: false,
    code: false,
    blockquote: false,
    bulletList: false,
    numberedList: false,
    link: false,
    canSink: false,
    canLift: false,
    selectionEmpty: true
  });

  useEffect(() => {
    if (!editor) return;

    let raf = 0;
    const compute = () => {
      const sel = editor.state.selection;
      const nextState = {
        heading:
          (editor.isActive('heading', { level: 1 }) && '1') ||
          (editor.isActive('heading', { level: 2 }) && '2') ||
          (editor.isActive('heading', { level: 3 }) && '3') ||
          (editor.isActive('heading', { level: 4 }) && '4') ||
          'normal',
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        code: editor.isActive('code'),
        blockquote: editor.isActive('blockquote'),
        bulletList: editor.isActive('bulletList'),
        numberedList: editor.isActive('orderedList'),
        link: editor.isActive('link'),
        selectionEmpty: sel?.empty ?? true,
        canSink: editor.can().chain().sinkListItem('listItem').run(),
        canLift: editor.can().chain().liftListItem('listItem').run(),
      };
      setUiState(prev => {
        for (const k in nextState) {
          // @ts-ignore shallow compare
          if (prev[k] !== nextState[k]) return nextState;
        }
        return prev;
      });
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    };

    editor.on('selectionUpdate', schedule);
    editor.on('transaction', schedule);
    editor.on('update', schedule);
    compute();

    return () => {
      editor.off('selectionUpdate', schedule);
      editor.off('transaction', schedule);
      editor.off('update', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [editor]);

  const btnType = (active: boolean) => (active ? 'primary' : 'default');

  function looksLikeUrl(s: string): boolean {
    const t = (s || '').trim();
    return (
      /^(https?:\/\/|ftp:\/\/|mailto:)/i.test(t) ||
      /^www\./i.test(t)
    );
  }

  function normalizeHref(raw: string): string {
    let href = (raw || '').trim();
    if (!href) return '';
    // collapse protocol-relative
    if (/^\/\//.test(href)) href = 'https:' + href;
    // if it already has a scheme, keep it
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(href) || /^mailto:/i.test(href)) {
      return href;
    }
    // add https:// for www.*
    if (/^www\./i.test(href)) {
      return 'https://' + href.replace(/^\/\//, '');
    }
    return href;
  }

  return (
    <Space
      wrap
      align="center"
      style={{
        width: '100%',
        padding: '8px 8px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer
      }}
    >
      <Select
        size="small"
        style={{ width: 100 }}
        value={uiState.heading}
        onChange={(val) =>
          val === 'normal'
            ? editor?.chain().focus().setParagraph().run()
            : editor?.chain().focus().setHeading({ level: parseInt(val, 10) }).run()
        }
        options={[
          { label: 'Normal', value: 'normal' },
          { label: 'H1', value: '1' },
          { label: 'H2', value: '2' },
          { label: 'H3', value: '3' },
          { label: 'H4', value: '4' }
        ]}
        disabled={disabled}
      />

      <Divider type="vertical" style={{ padding: 0, margin: 2 }} />

      <Tooltip title="Bold (Ctrl+B)">
        <Button
          size="small"
          icon={<BoldOutlined />}
          type={btnType(uiState.bold)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}
          disabled={disabled}
        />
      </Tooltip>

      <Tooltip title="Italic (Ctrl+I)">
        <Button
          size="small"
          icon={<ItalicOutlined />}
          type={btnType(uiState.italic)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}
          disabled={disabled}
        />
      </Tooltip>

      <Tooltip title="Underline (Ctrl+U)">
        <Button
          size="small"
          icon={<UnderlineOutlined />}
          type={btnType(uiState.underline)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleUnderline().run(); }}
          disabled={disabled}
        />
      </Tooltip>

      <Tooltip title="Inline code">
        <Button
          size="small"
          icon={<CodeOutlined />}
          type={btnType(uiState.code)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleCode().run(); }}
          disabled={disabled}
        />
      </Tooltip>

      <Tooltip title="Block quote">
        <Button
          size="small"
          icon={<DoubleRightOutlined />}
          type={btnType(uiState.blockquote)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run(); }}
          disabled={disabled}
        />
      </Tooltip>

      <Tooltip title="Insert/Edit link">
        <Button
          size="small"
          icon={<LinkOutlined />}
          type={btnType(uiState.link)}
          disabled={disabled}
          onMouseDown={async (e) => {
            e.preventDefault();
            if (!editor) return;

            const { state } = editor;
            const sel = state.selection;
            const selectedText = state.doc.textBetween(sel.from, sel.to).trim();

            let initial = { url: '', title: '' };
            let replaceFrom = sel.from;
            let replaceTo = sel.to;

            // 1) If caret/selection is inside a link mark, pull attrs + full link text
            if (editor.isActive('link')) {
              const attrs = editor.getAttributes('link') || {};
              const hrefFromMark = attrs.href || '';
              const titleAttr = (attrs.title || '').trim();

              // Range of the whole link mark (even if selection is collapsed)
              try {
                const markType = state.schema.marks.link;
                const $pos = state.doc.resolve(sel.from);
                const range = getMarkRange($pos, markType);
                if (range) {
                  replaceFrom = range.from;
                  replaceTo = range.to;
                }
              } catch { /* ignore */ }

              const currentLinkText = state.doc.textBetween(replaceFrom, replaceTo).trim();

              initial = {
                url: hrefFromMark,
                title: titleAttr || currentLinkText || ''
              };
            } else {
              // 2) Otherwise, prefill from selection heuristics
              if (!sel.empty) {
                if (looksLikeUrl(selectedText)) {
                  initial = { url: normalizeHref(selectedText), title: '' };
                } else {
                  initial = { url: '', title: selectedText };
                }
              }
            }

            // 3) Open prompt and apply result
            const result = await askLink(initial);
            if (!result) return;

            const url = normalizeHref(result.url);
            if (!url) return;
            const title = (result.title || '').trim();

            // Choose label: provided title, else visible text (selection/link), else from URL
            const visibleText =
              state.doc.textBetween(replaceFrom, replaceTo).trim() || '';
            const label = title || visibleText || url;

            editor
              .chain()
              .focus()
              .insertContentAt(
                { from: replaceFrom, to: replaceTo },
                [
                  { type: 'text', text: label, marks: [{ type: 'link', attrs: { href: url, ...(title ? { title } : {}) } }] },
                  { type: 'text', text: ' ' }
                ]
              )
              .setTextSelection(replaceFrom + label.length + 1)
              .unsetMark('link')
              .run();
          }}
        />
      </Tooltip>

      {linkModal}

      <Tooltip title="Clear formatting">
        <Button
          size="small"
          icon={<ClearOutlined />}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().unsetAllMarks().clearNodes().run(); }}
          disabled={disabled}
        />
      </Tooltip>

      <Divider type="vertical" style={{ padding: 0, margin: 2 }} />

      <Tooltip title="Bulleted list">
        <Button
          size="small"
          type={btnType(uiState.bulletList)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}
          disabled={disabled}
          icon={
            <svg width="1em" height="1em" viewBox="0 0 17 17" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
              <circle cx="3" cy="5" r="1.8" />
              <circle cx="3" cy="13" r="1.8" />
              <line x1="7" y1="5" x2="15" y2="5" />
              <line x1="7" y1="13" x2="15" y2="13" />
            </svg>
          }
        />
      </Tooltip>

      <Tooltip title="Numbered list">
        <Button
          size="small"
          type={btnType(uiState.numberedList)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }}
          disabled={disabled}
          icon={
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1">
              <text x="1" y="8" fontSize="6" fontFamily="monospace">1</text>
              <text x="1" y="15" fontSize="6" fontFamily="monospace">2</text>
              <line x1="7" y1="5" x2="15" y2="5" />
              <line x1="7" y1="13" x2="15" y2="13" />
            </svg>
          }
        />
      </Tooltip>

      <Tooltip title="Increase item indent">
        <Button
          size="small"
          icon={<ArrowRightOutlined />}
          disabled={!uiState.canSink}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().sinkListItem('listItem').run(); }}
        />
      </Tooltip>

      <Tooltip title="Decrease item indent">
        <Button
          size="small"
          icon={<ArrowLeftOutlined />}
          disabled={!uiState.canLift}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().liftListItem('listItem').run(); }}
        />
      </Tooltip>
    </Space>
  );
});


/* -----------------------------------------------------------------------------
 *  Editor
 * -------------------------------------------------------------------------- */

export interface TextAreaWidgetProps {
  id?: string;
  value?: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  readonly?: boolean;
  resizable?: boolean;
  minHeight?: number | string;
  maxHeight?: number | string;
  debouncems?: number;
}

export default function TextAreaWidget(props: TextAreaWidgetProps) {
  const {
    id, value, onChange, disabled, readonly,
    resizable = true, minHeight = 150, maxHeight = '80vh', debouncems = 180
  } = props;

  const isLocked = !!(disabled || readonly);
  const { token } = theme.useToken();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      })
    ],
    editable: !isLocked,
    content: value || '',
    onUpdate: ({ editor }) => scheduleChangeFlush(editor),
  });

  const lastSentRef = useRef<string>(value || '');
  const debounceRef = useRef<number | null>(null);

  // const flushChange = useCallback((editor: any) => {
  //   const html = editor.getHTML();
  //   if (html !== lastSentRef.current) {
  //     lastSentRef.current = html;
  //     onChange(html);
  //   }
  // }, [onChange]);

  const flushChange = useCallback((editor: any) => {
    const html = editor.getHTML();
    const normalised = editor.isEmpty ? '' : html;

    if (normalised !== lastSentRef.current) {
      lastSentRef.current = normalised;
      onChange(normalised);
    }
  }, [onChange]);


  const scheduleChangeFlush = useCallback((editor: any) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => flushChange(editor), debouncems);
  }, [flushChange, debouncems]);

  useEffect(() => {
    if (!editor) return;
    const flush = () => flushChange(editor);
    editor.on('blur', flush);
    return () => {
      editor.off('blur', flush);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [editor, flushChange]);

  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    if (incoming !== lastSentRef.current) {
      lastSentRef.current = incoming;
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!isLocked);
  }, [isLocked, editor]);


  const activateOnEmptyAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      editor.chain().focus('end').run();
    }
  };

  if (!editor) return null;

  return (
    <div
      id={id}
      className="x-rich-text-editor"
      style={{ border: `1px solid ${token.colorBorder}`, background: token.colorBgContainer }}
    >
      <Toolbar editor={editor} disabled={isLocked} />
      <div
        className="x-rich-text-editor-content"
        onClick={activateOnEmptyAreaClick}
        style={{
          outline: 'none',
          width: '100%',
          padding: 10,
          minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          resize: resizable ? 'vertical' : 'none',
          overflow: 'auto',
          cursor: 'text',
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
