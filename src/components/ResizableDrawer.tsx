import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';
import { Drawer, Button } from 'antd';
import type { DrawerProps } from 'antd';
import { ColumnWidthOutlined } from '@ant-design/icons';

/**
 * Behaviour:
 * - Content width updates LIVE only when NARROWING.
 * - When WIDENING, content width remains fixed until mouse-up (commit).
 * - Works for placement "right" (widen = drag ghost left) and "left" (widen = drag ghost right).
 * - Ghost line shows future edge across the viewport.
 */

type SidePlacement = Extract<DrawerProps['placement'], 'left' | 'right'>;

export type ResizableDrawerProps = Omit<DrawerProps, 'width' | 'height' | 'placement'> & {
  placement?: SidePlacement;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  bodyPadding?: number;
  showResetButton?: boolean;
  onWidthChange?: (w: number) => void;
  resetLabel?: string;
};

export default function ResizableDrawer({
  placement = 'right',
  initialWidth,
  minWidth = 250,
  maxWidth,
  bodyPadding = 16,
  showResetButton = true,
  onWidthChange,
  resetLabel = 'Reset width',
  title,
  extra,
  open,
  onClose,
  children,
  styles,
  ...rest
}: ResizableDrawerProps) {
  // Viewport-aware defaults
  const defaultInitialWidth = useMemo(
    () =>
      typeof window !== 'undefined'
        ? Math.min(500, Math.round(window.innerWidth * 0.3))
        : 500,
    []
  );
  const [maxW, setMaxW] = useState<number>(() =>
    typeof window !== 'undefined'
      ? Math.min(900, Math.round(window.innerWidth * 0.7))
      : 900
  );

  const initialW = initialWidth ?? defaultInitialWidth;
  const initialWRef = useRef(initialW);

  const clamp = useCallback(
    (v: number) => {
      const cap = maxWidth ?? maxW;
      return Math.min(Math.max(v, minWidth), cap);
    },
    [minWidth, maxWidth, maxW]
  );

  const [width, setWidth] = useState<number>(clamp(initialW)); // committed panel width
  const [visualWidth, setVisualWidth] = useState<number>(clamp(initialW)); // what the content uses DURING drag

  const setWidthClamped = useCallback(
    (w: number) => {
      const next = clamp(w);
      setWidth(next);
      setVisualWidth(next);
      onWidthChange?.(next);
    },
    [clamp, onWidthChange]
  );

  // Keep max width sensible on viewport resize
  useEffect(() => {
    const onResize = () => {
      const cap =
        maxWidth ??
        (typeof window !== 'undefined'
          ? Math.min(900, Math.round(window.innerWidth * 0.7))
          : 900);
      setMaxW(cap);
      setWidthClamped(width); // re-clamp if needed
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxWidth]);

  // Measure body height so the handle area is fully draggable
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [boxHeight, setBoxHeight] = useState<number>(300);
  useEffect(() => {
    if (!bodyRef.current) return;
    const el = bodyRef.current;
    const ro = new ResizeObserver(() => setBoxHeight(el.clientHeight || 300));
    ro.observe(el);
    setBoxHeight(el.clientHeight || 300);
    return () => ro.disconnect();
  }, [open]);

  // Reset to original width
  const resetWidth = useCallback(() => {
    setWidthClamped(initialWRef.current);
  }, [setWidthClamped]);

  // Placement / handle side
  const isRight = placement === 'right';
  const resizeHandles = [isRight ? 'w' : 'e'] as const;

  // --- Ghost line + live sizing state ---
  const frameRef = useRef<number | null>(null);
  const liveWidthRef = useRef<number>(width); // live width under the cursor during drag
  const ghostElRef = useRef<HTMLDivElement | null>(null);

  const ensureGhostEl = useCallback(() => {
    if (ghostElRef.current) return ghostElRef.current;
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, {
      position: 'fixed',
      top: '0',
      bottom: '0',
      width: '1px',
      background: 'rgba(0,0,0,0.35)',
      pointerEvents: 'none',
      zIndex: '2147483647',
    } as CSSStyleDeclaration);
    document.body.appendChild(el);
    ghostElRef.current = el;
    return el;
  }, []);

  const removeGhostEl = useCallback(() => {
    if (ghostElRef.current?.parentNode) {
      ghostElRef.current.parentNode.removeChild(ghostElRef.current);
    }
    ghostElRef.current = null;
  }, []);

  const positionGhost = useCallback(() => {
    if (!ghostElRef.current) return;
    const live = liveWidthRef.current;
    const vw = window.innerWidth;
    const leftPx = isRight
      ? Math.max(0, Math.min(vw, vw - live))
      : Math.max(0, Math.min(vw, live));
    ghostElRef.current.style.left = `${leftPx}px`;
  }, [isRight]);

  const handleResizeStart = useCallback(() => {
    document.body.style.userSelect = 'none';
    liveWidthRef.current = width;
    ensureGhostEl();
    positionGhost();
    setVisualWidth(width);
  }, [width, ensureGhostEl, positionGhost]);

  const handleResize = useCallback((_e: any, data: any) => {
    liveWidthRef.current = Math.round(data.size.width);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      positionGhost();
      const live = liveWidthRef.current;

      // Only update content width LIVE when narrowing
      if (live < width) {
        setVisualWidth(live);
      } else {
        setVisualWidth(width); // keep fixed while widening
      }
    });
  }, [positionGhost, width]);

  const handleResizeStop = useCallback(() => {
    document.body.style.userSelect = '';
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    removeGhostEl();
    // Commit once at the end
    const committed = liveWidthRef.current;
    setWidthClamped(committed);
  }, [removeGhostEl, setWidthClamped]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      document.body.style.userSelect = '';
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      removeGhostEl();
    };
  }, [removeGhostEl]);

  const headerExtra = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {extra}
      {showResetButton && (
        <Button
          size="small"
          icon={<ColumnWidthOutlined />}
          onClick={resetWidth}
          title={resetLabel}
        />
      )}
    </div>
  );

  const mergedStyles: DrawerProps['styles'] = {
    ...styles,
    body: { padding: 0, overflow: 'visible', ...(styles?.body || {}) },
  };

  // The content container's width is controlled by visualWidth during drag.
  // Anchor to the edge using flex to keep it flush with the fixed side.
  const contentShellStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    justifyContent: isRight ? 'flex-end' : 'flex-start',
    boxSizing: 'border-box',
  };

  const contentInnerStyle: React.CSSProperties = {
    width: visualWidth, // THIS is what visually resizes only on narrowing
    height: '100%',
    padding: bodyPadding,
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  return (
    <Drawer
      placement={placement}
      title={title}
      extra={headerExtra}
      open={open}
      onClose={onClose}
      width={width}
      mask={false}
      styles={mergedStyles}
      style={{ willChange: 'width', ...(rest.style || {}) }}
      {...rest}
    >
      <div
        ref={bodyRef}
        style={{
          position: 'relative',
          height: '100%',
          overflow: 'visible',
          contain: 'layout paint size style',
        }}
      >
        {/* Content that narrows live, widens only on commit */}
        <div style={contentShellStyle}>
          <div style={contentInnerStyle}>
            {children}
          </div>
        </div>

        {/* OVERLAY ResizableBox – absolute, supplies drag handle + live size reading */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            ...(isRight ? { right: 0 } : { left: 0 }),
            width: width,
            pointerEvents: 'none',
          }}
        >
          <ResizableBox
            width={width}
            height={boxHeight}
            axis="x"
            resizeHandles={resizeHandles as any}
            minConstraints={[minWidth, boxHeight]}
            maxConstraints={[maxWidth ?? maxW, boxHeight]}
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeStop={handleResizeStop}
            draggableOpts={{ enableUserSelectHack: false } as any}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              ...(isRight ? { right: 0 } : { left: 0 }),
              height: '100%',
              overflow: 'visible',
              pointerEvents: 'none',
            }}
            handle={(axis, ref) => {
              if (axis !== resizeHandles[0]) return null;
              const sideStyle = isRight ? { left: 0 } : { right: 0 };
              return (
                <div
                  ref={ref as any}
                  role="separator"
                  aria-orientation="vertical"
                  title="Drag to resize"
                  style={{
                    position: 'absolute',
                    top: 0,
                    ...sideStyle,
                    width: 10,
                    height: '100%',
                    cursor: 'ew-resize',
                    zIndex: 9999,
                    background: 'transparent',
                    touchAction: 'none',
                    pointerEvents: 'auto',
                  }}
                />
              );
            }}
          >
            <div style={{ width: '100%', height: '100%' }} />
          </ResizableBox>
        </div>
      </div>
    </Drawer>
  );
}
