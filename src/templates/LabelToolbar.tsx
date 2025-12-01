import { Button, Tooltip } from 'antd';
import { FileSearchOutlined, EyeOutlined } from '@ant-design/icons';

interface LabelToolbarProps {
  formContext: any;
  topFieldKey: string;
}

export default function LabelToolbar({ formContext, topFieldKey }: LabelToolbarProps) {

  const openExamplesForField =
    formContext?.openExamplesForField as ((k: string) => void);

  const openPreviewForField =
    formContext?.openPreviewForField as ((k: string) => void);

  return (
    <span className="x-field-actions">
      <Tooltip title="Preview current field">
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => topFieldKey && openPreviewForField?.(topFieldKey)}
          style={{ marginRight: 5 }}
        >
          Preview
        </Button>
      </Tooltip>

      <Tooltip title="Show examples">
        <Button
          size="small"
          icon={<FileSearchOutlined />}
          onClick={() => topFieldKey && openExamplesForField?.(topFieldKey)}
        >
          Examples
        </Button>
      </Tooltip>
    </span>
  );
}
