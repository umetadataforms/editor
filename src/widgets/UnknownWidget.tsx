import { TextInput } from '@mantine/core';
import type { WidgetProps } from '@rjsf/utils';

/**
 * Read-only input that renders the schema constant value.
 */
export default function UnknownWidget(props: WidgetProps) {
  const { id, name, htmlName, rawErrors, schema } = props;
  const schemaRecord = schema as Record<string, unknown> | undefined;
  const displayValue = typeof schemaRecord?.const === 'string'
    ? schemaRecord.const
    : '';

  return (
    <TextInput
      id={id}
      name={htmlName || name}
      value={displayValue}
      disabled
      readOnly
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      style={{ width: '100%' }}
    />
  );
}
