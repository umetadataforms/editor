import type { ReactNode } from 'react';
import { ActionIcon, Loader, Tooltip } from '@mantine/core';

/* -------------------------------------------------------------------------- */

type Props = {
  title: string;
  ariaLabel: string;
  icon: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/** Renders a labeled toolbar icon button with tooltip. */
export default function ToolbarButton({
  title,
  ariaLabel,
  icon,
  onClick,
  loading,
  disabled,
}: Props) {
  return (
    <Tooltip label={title} position="right" withArrow>
      <ActionIcon
        variant="subtle"
        size="xl"
        radius="md"
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        onClick={onClick}
        disabled={disabled || loading}
        style={{ color: 'var(--mantine-color-text)' }}
      >
        {loading ? <Loader size="sm" color="var(--mantine-color-text)" /> : icon}
      </ActionIcon>
    </Tooltip>
  );
}
