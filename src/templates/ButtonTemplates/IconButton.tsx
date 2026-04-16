/* eslint-disable react-refresh/only-export-components */
import { cloneElement, isValidElement } from 'react';
import type { MouseEventHandler, ReactElement } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import type { ActionIconProps } from '@mantine/core';
import type {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { TranslatableString, getUiOptions } from '@rjsf/utils';
import { IconChevronDown, IconChevronUp, IconCopy, IconX } from '@tabler/icons-react';

export type MantineIconButtonProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = IconButtonProps<T, S, F>
  & Omit<ActionIconProps, 'onClick'>
  & {
    iconSize?: number;
  };

type TooltipOptions = {
  tooltipSuffix?: string;
};

/**
 * Resolves a tooltip label from uiSchema options.
 *
 * @param props - The icon button props.
 */
export const getTooltipText = <T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: MantineIconButtonProps<T, S, F>,
  fallbackLabel: string,
  actionLabel?: string,
) => {
  const uiOptions = getUiOptions<T, S, F>(props.uiSchema, props.registry.globalUiOptions) as TooltipOptions;
  const suffix = typeof uiOptions?.tooltipSuffix === 'string' ? uiOptions.tooltipSuffix.trim() : '';
  if (suffix) {
    const base = actionLabel || fallbackLabel;
    return `${base} ${suffix}`.trim();
  }
  return fallbackLabel;
};

/**
 * Wraps an icon button with a tooltip.
 *
 * @param label - Tooltip label.
 */
export const withTooltip = (label: string, node: ReactElement) => (
  <Tooltip label={label} withArrow>
    <span>{node}</span>
  </Tooltip>
);

/**
 * Renders a base ActionIcon for RJSF icon buttons.
 *
 * @param props - The icon button props.
 */
export default function IconButton<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const {
    icon,
    iconType = 'sm',
    iconSize,
    color,
    onClick,
    ...otherProps
  } = props;
  const resolvedIcon = isValidElement<{ size?: number }>(icon)
    ? cloneElement(icon, {
      size: typeof iconSize === 'number' ? iconSize : icon.props.size ?? 16,
    })
    : icon;
  return (
    <ActionIcon
      size={iconType as ActionIconProps['size']}
      color={color as ActionIconProps['color']}
      onClick={onClick as MouseEventHandler<HTMLAnchorElement> & MouseEventHandler<HTMLButtonElement>}
      {...otherProps}
    >
      {resolvedIcon}
    </ActionIcon>
  );
}

/**
 * Renders the copy action button.
 *
 * @param props - The icon button props.
 */
export function CopyButton<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  const tooltipText = getTooltipText(props, translateString(TranslatableString.CopyButton), 'Copy');
  const button = (
    <IconButton
      title={tooltipText}
      variant='subtle'
      {...props}
      icon={<IconCopy />}
    />
  );
  return withTooltip(tooltipText, button);
}

/**
 * Renders the move-down action button.
 *
 * @param props - The icon button props.
 */
export function MoveDownButton<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const tooltipText = 'Move down';
  const button = (
    <IconButton
      title={tooltipText}
      variant='subtle'
      {...props}
      icon={<IconChevronDown />}
    />
  );
  return withTooltip(tooltipText, button);
}

/**
 * Renders the move-up action button.
 *
 * @param props - The icon button props.
 */
export function MoveUpButton<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const tooltipText = 'Move up';
  const button = (
    <IconButton
      title={tooltipText}
      variant='subtle'
      {...props}
      icon={<IconChevronUp />}
    />
  );
  return withTooltip(tooltipText, button);
}

/**
 * Renders the remove action button.
 *
 * @param props - The icon button props.
 */
export function RemoveButton<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  const tooltipText = getTooltipText(props, translateString(TranslatableString.RemoveButton), 'Remove');
  const button = (
    <IconButton
      title={tooltipText}
      variant='subtle'
      color='red'
      {...props}
      icon={<IconX />}
    />
  );
  return withTooltip(tooltipText, button);
}

/**
 * Renders the clear action button.
 *
 * @param props - The icon button props.
 */
export function ClearButton<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: MantineIconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;

  const tooltipText = getTooltipText(props, translateString(TranslatableString.ClearButton), 'Clear');
  const button = (
    <IconButton
      title={tooltipText}
      variant='subtle'
      {...props}
      icon={<IconX />}
    />
  );
  return withTooltip(tooltipText, button);
}
