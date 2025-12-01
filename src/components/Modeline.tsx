import { useEffect, useRef, useState } from 'react';
import { theme } from 'antd';

export type SaveStatus = 'saved' | 'modified' | 'ready';

interface ModelineProps {
  /** Name of the uploaded/saved file */
  fileName?: string | null;
  /** Optional zIndex override if needed by your layout. */
  zIndex?: number;
}

/** Internal custom event name used to show a transient inline message. */
const MODELINE_EVENT = 'modeline:message';

/**
 * Dispatch a transient inline message to the Modeline.
 * The Modeline will show this message IN PLACE OF the file name,
 * then restore the file name after `durationMs` (default: 2000ms).
 */
export function showModelineInlineMessage(message: string, durationMs = 2000) {
  window.dispatchEvent(
    new CustomEvent(MODELINE_EVENT, { detail: { message, durationMs } })
  );
}

/**
 * Single-line modeline fixed to the bottom.
 * Left side: shows a transient message if active, otherwise the file name.
 * Colours adapt to the current Ant Design theme via tokens.
 */
export default function Modeline({
  fileName = 'unnamed',
  zIndex = 12,
}: ModelineProps) {
  const { token } = theme.useToken();

  // When non-null, this message replaces the filename temporarily.
  const [leftMsg, setLeftMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (ev: Event) => {
      const { message, durationMs } = (ev as CustomEvent).detail ?? {};
      setLeftMsg(message ?? null);

      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (message) {
        timerRef.current = window.setTimeout(() => {
          setLeftMsg(null); // restore filename
        }, durationMs ?? 2000);
      }
    };

    window.addEventListener(MODELINE_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(MODELINE_EVENT, handler as EventListener);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const displayText = leftMsg ?? fileName ?? 'unnamed';

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 12,
        lineHeight: '28px',
        background: token.colorBgContainer,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        color: token.colorText,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        zIndex,
        transition: 'background-color 0.2s ease, color 0.2s ease',
        gap: 8,
      }}
      title={displayText}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {displayText}
      </span>
    </div>
  );
}
