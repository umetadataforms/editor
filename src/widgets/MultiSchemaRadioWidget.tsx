import { useCallback } from 'react';
import type { FocusEvent } from 'react';
import type { EnumOptionsType, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  optionId,
  labelValue,
} from '@rjsf/utils';
import { ActionIcon, Flex, Radio, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { getDescriptionFirstLine } from '../utils/description-utils';
import { useDescriptionPanel } from '../components/Panels/DescriptionPanel';

/**
 * Radio widget for oneOf/anyOf selection with inline descriptions.
 */
export default function MultiSchemaRadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    rawErrors,
    options,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const { enumOptions, enumDisabled, inline, emptyValue } = options as {
    enumOptions?: EnumOptionsType<S>[];
    enumDisabled?: unknown[];
    inline?: boolean;
    emptyValue?: unknown;
  };
  const { openDescription } = useDescriptionPanel();

  const handleChange = useCallback(
    (nextValue: string) => {
      if (!disabled && !readonly && onChange) {
        onChange(enumOptionsValueForIndex(nextValue, enumOptions, emptyValue));
      }
    },
    [onChange, disabled, readonly, enumOptions, emptyValue]
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionsValueForIndex(target && target.value, enumOptions, emptyValue));
      }
    },
    [onBlur, id, enumOptions, emptyValue]
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionsValueForIndex(target && target.value, enumOptions, emptyValue));
      }
    },
    [onFocus, id, enumOptions, emptyValue]
  );

  const selected = enumOptionsIndexForValue(value, enumOptions) as string;

  return (
    <Radio.Group
      id={id}
      name={htmlName || id}
      value={selected}
      label={!hideLabel ? labelValue(label || undefined, hideLabel, false) : undefined}
      onChange={handleChange}
      required={required}
      readOnly={disabled || readonly}
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      aria-describedby={ariaDescribedByIds(id)}
    >
      {Array.isArray(enumOptions) ? (
        <Flex
          mt="xs"
          direction={inline === false ? 'column' : 'row'}
          gap="sm"
          wrap="wrap"
          className="umfe-radio-group"
        >
          {enumOptions.map((option: EnumOptionsType<S>, i: number) => {
            const optionDisabled = Array.isArray(enumDisabled)
              ? enumDisabled.indexOf(option.value) !== -1
              : false;
            const optionRecord = option as Record<string, unknown>;
            const description = typeof optionRecord.description === 'string' ? optionRecord.description : '';
            const tooltipText = description ? getDescriptionFirstLine(description) : '';
            const labelNode = (
              <span className="umfe-radio-option-label">
                <span className="umfe-radio-option-text">{option.label}</span>
                {description ? (
                  <Tooltip label={tooltipText} withArrow>
                    <ActionIcon
                      size="xs"
                      radius="md"
                      variant="subtle"
                      aria-label="Show description"
                      className="umfe-info-icon"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openDescription({ title: option.label || '', description });
                      }}
                    >
                      <IconInfoCircle size={16} />
                    </ActionIcon>
                  </Tooltip>
                ) : null}
              </span>
            );

            return (
              <Radio
                key={i}
                id={optionId(id, i)}
                value={String(i)}
                label={labelNode}
                disabled={optionDisabled}
                autoFocus={i === 0 && autofocus}
                onBlur={handleBlur}
                onFocus={handleFocus}
                className="umfe-radio-option"
              />
            );
          })}
        </Flex>
      ) : null}
    </Radio.Group>
  );
}
