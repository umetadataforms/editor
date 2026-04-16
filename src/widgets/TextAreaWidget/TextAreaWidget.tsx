import { memo, useState, useCallback, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { getMarkRange } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import type { WidgetProps } from '@rjsf/utils';

import { ActionIcon, Divider, Group, Select, Tooltip, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBold,
  IconClearFormatting,
  IconCode,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconQuote,
  IconUnderline,
} from '@tabler/icons-react';

import LinkPrompt from './LinkPrompt';

const DEFAULT_DEBOUNCE_MS = 180;
const COMMIT_ON_BLUR = false;

/* -----------------------------------------------------------------------------
 * Toolbar
 * -------------------------------------------------------------------------- */

const Toolbar = memo(function Toolbar(
  { editor, disabled }: { editor: Editor | null; disabled?: boolean }
) {
  const [askLink, linkModal] = LinkPrompt();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? theme.colors.gray[0] : theme.black;
  const activeBg = isDark ? theme.colors.dark[5] : theme.colors.gray[1];

  const actionStyle = (active: boolean) => ({
    color: iconColor,
    backgroundColor: active ? activeBg : 'transparent',
  });

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
      setUiState((prev) => {
        const keys = Object.keys(nextState) as Array<keyof typeof nextState>;
        for (const key of keys) {
          if (prev[key] !== nextState[key]) return nextState;
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

  const btnVariant = () => 'subtle';

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
    <Group
      wrap="wrap"
      align="center"
      gap="xs"
      style={{
        width: '100%',
        padding: '8px 8px',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        background: 'var(--mantine-color-body)'
      }}
    >
      <Select
        size="xs"
        style={{ width: 110 }}
        value={uiState.heading}
        onChange={(val) => {
          const next = val || 'normal';
          if (next === 'normal') {
            editor?.chain().focus().setParagraph().run();
          } else {
            const level = next === '3' ? 3 : 4;
            editor?.chain().focus().setHeading({ level }).run();
          }
        }}
        data={[
          { label: 'Normal', value: 'normal' },
          { label: 'H3', value: '3' },
          { label: 'H4', value: '4' }
        ]}
        disabled={disabled}
      />

      <Divider orientation="vertical" />

      <Tooltip label="Bold (Ctrl+B)" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(uiState.bold)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}
          disabled={disabled}
        >
          <IconBold size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Italic (Ctrl+I)" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(uiState.italic)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}
          disabled={disabled}
        >
          <IconItalic size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Underline (Ctrl+U)" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(uiState.underline)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleUnderline().run(); }}
          disabled={disabled}
        >
          <IconUnderline size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Inline code" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(uiState.code)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleCode().run(); }}
          disabled={disabled}
        >
          <IconCode size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Block quote" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(uiState.blockquote)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run(); }}
          disabled={disabled}
        >
          <IconQuote size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Insert/Edit link" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(uiState.link)}
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
        >
          <IconLink size={16} />
        </ActionIcon>
      </Tooltip>

      {linkModal}

      <Tooltip label="Clear formatting" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(false)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().unsetAllMarks().clearNodes().run(); }}
          disabled={disabled}
        >
          <IconClearFormatting size={16} />
        </ActionIcon>
      </Tooltip>

      <Divider orientation="vertical" />

      <Tooltip label="Bulleted list" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(uiState.bulletList)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}
          disabled={disabled}
        >
          <IconList size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Numbered list" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(uiState.numberedList)}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }}
          disabled={disabled}
        >
          <IconListNumbers size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Increase item indent" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(false)}
          disabled={!uiState.canSink}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().sinkListItem('listItem').run(); }}
        >
          <IconArrowRight size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Decrease item indent" withArrow>
        <ActionIcon
          size="sm"
          variant={btnVariant()}
          style={actionStyle(false)}
          disabled={!uiState.canLift}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().liftListItem('listItem').run(); }}
        >
          <IconArrowLeft size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
});


/* -----------------------------------------------------------------------------
 *  Editor
 * -------------------------------------------------------------------------- */

export default function TextAreaWidget(props: WidgetProps) {
  const {
    id,
    value,
    onChange,
    disabled,
    readonly,
    options,
  } = props;

  const optionsRecord = options as Record<string, unknown> | undefined;
  const resizable = typeof optionsRecord?.resizable === 'boolean' ? optionsRecord.resizable : true;
  const minHeight = typeof optionsRecord?.minHeight === 'number' ? optionsRecord.minHeight : 150;
  const maxHeight = typeof optionsRecord?.maxHeight === 'number' || typeof optionsRecord?.maxHeight === 'string'
    ? optionsRecord.maxHeight
    : '80vh';

  const debouncems = DEFAULT_DEBOUNCE_MS;
  const commitOnBlur = COMMIT_ON_BLUR;

  const isLocked = !!(disabled || readonly);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3, 4] }, codeBlock: false }),
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
    onUpdate: commitOnBlur
      ? undefined
      : ({ editor }: { editor: Editor }) => scheduleChangeFlush(editor),
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

  const flushChange = useCallback((editor: Editor) => {
    const html = editor.getHTML();
    const normalised = editor.isEmpty ? '' : html;

    if (normalised !== lastSentRef.current) {
      lastSentRef.current = normalised;
      onChange(normalised);
    }
  }, [onChange]);


  const scheduleChangeFlush = useCallback((editor: Editor) => {
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


  const activateOnEmptyAreaClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      editor.chain().focus('end').run();
    }
  };

  if (!editor) return null;

  return (
    <div
      id={id}
      className="umfe-rich-text-editor"
      style={{ border: '1px solid var(--mantine-color-default-border)', background: 'var(--mantine-color-body)' }}
    >
      <Toolbar editor={editor} disabled={isLocked} />
      <div
        className="umfe-rich-text-editor-content"
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
