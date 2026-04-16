import { Button, Tooltip } from '@mantine/core';

import { useExamplesPanel } from '../components/Panels/ExamplesPanel';
import { usePreviewPanel } from '../components/Panels/PreviewPanel';

interface FieldLabelToolbarProps {
  topFieldKey: string;
  className?: string;
}

/**
 * Label toolbar that exposes Preview and Examples actions for a field header.
 * It uses callbacks from formContext to open the corresponding panels.
 *
 * @param props - The `FieldLabelToolbarProps` for this component
 */
export default function FieldLabelToolbar(props: FieldLabelToolbarProps) {
  const { topFieldKey, className } = props;
  const { openExamplesForField } = useExamplesPanel();
  const { openPreviewForField } = usePreviewPanel();

  return (
    <span className={className ?? 'umfe-field-actions'}>
      <Tooltip label="Preview current field" withArrow>
        <Button
          size="xs"
          onClick={() => topFieldKey && openPreviewForField(topFieldKey)}
          variant="default"
          style={{ marginRight: 5 }}
        >
          Preview
        </Button>
      </Tooltip>

      <Tooltip label="Show examples" withArrow>
        <Button
          size="xs"
          onClick={() => topFieldKey && openExamplesForField(topFieldKey)}
          variant="default"
        >
          Examples
        </Button>
      </Tooltip>
    </span>
  );
}
