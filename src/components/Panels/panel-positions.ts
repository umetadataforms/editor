/**
 * Position helpers for panels.
 */

import type { PanelType } from './Panels';
import {
  getViewportSize,
  PANEL_MARGIN,
  PANEL_STACK_GAP
} from './panel-dimensions';

/**
 * Clamps a numeric value to the provided range.
 */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Keeps a panel position inside the viewport bounds.
 */
export function clampPosition(
  position: { x: number; y: number },
  size: { width: number; height: number }
) {
  const { width: vw, height: vh } = getViewportSize();
  const maxX = Math.max(PANEL_MARGIN, vw - size.width - PANEL_MARGIN);
  const maxY = Math.max(PANEL_MARGIN, vh - size.height - PANEL_MARGIN);
  return {
    x: clamp(position.x, PANEL_MARGIN, maxX),
    y: clamp(position.y, PANEL_MARGIN, maxY),
  };
}

/**
 * Computes a first position for a new panel, preferring stacked layouts.
 */
export function resolveInitialPosition(
  type: PanelType,
  size: { width: number; height: number }
) {
  if (type === 'info') {
    const viewport = getViewportSize();
    const x = Math.round((viewport.width - size.width) / 2);
    const y = Math.round((viewport.height - size.height) / 2);
    return clampPosition({ x, y }, size);
  }
  return getStackedPosition(type, size);
}

/**
 * Returns the stacked position for preview/examples panels.
 */
export function getStackedPosition(
  type: PanelType,
  size: { width: number; height: number }
) {
  const viewport = getViewportSize();
  const x = viewport.width - size.width - PANEL_MARGIN;
  const topY = PANEL_MARGIN;
  const bottomY = PANEL_MARGIN + size.height + PANEL_STACK_GAP;
  const position = type === 'examples'
    ? { x, y: topY }
    : { x, y: bottomY };
  return clampPosition(position, size);
}
