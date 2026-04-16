/**
 * Dimension helpers for panels.
 */

import type { PanelType } from './Panels';

/**
 * Margin used when positioning panels within the viewport.
 */
export const PANEL_MARGIN = 8;

/**
 * Vertical gap between stacked panels.
 */
export const PANEL_STACK_GAP = 0;

/**
 * Returns the current viewport size.
 */
export function getViewportSize() {
  if (typeof window === 'undefined') return { width: 1200, height: 800 };
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Computes a default panel size for the given panel type.
 */
export function getDefaultSize(type: PanelType) {
  const viewport = getViewportSize();
  if (type === 'info') {
    const phi = 1.618;
    const maxWidth = Math.max(320, viewport.width - PANEL_MARGIN * 2);
    const maxHeight = Math.max(240, viewport.height - PANEL_MARGIN * 2);
    let width = Math.min(640, Math.round(viewport.width * 0.45));
    let height = Math.round(width / phi);
    if (height > Math.round(viewport.height * 0.6)) {
      height = Math.round(viewport.height * 0.6);
      width = Math.round(height * phi);
    }
    width = Math.min(width, maxWidth);
    height = Math.min(height, maxHeight);
    return { width, height };
  }
  const width = Math.min(520, Math.round(viewport.width * 0.35));
  if (type === 'preview' || type === 'examples') {
    const availableHeight = Math.max(320, viewport.height - PANEL_MARGIN * 2 - PANEL_STACK_GAP);
    const height = Math.round(availableHeight / 2);
    return { width, height };
  }
  const height = Math.min(460, Math.round(viewport.height * 0.45));
  return { width, height };
}
