import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';

/* -------------------------------------------------------------------------- */

type Props = {
  title: string;
  ariaLabel: string;
  icon: React.ReactNode;
  onClick?: () => void;
};

export default function ToolbarButton({
  title,
  ariaLabel,
  icon,
  onClick,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };

  return (
    <Tooltip
      placement="right"
      title={title}
      open={open}
      onOpenChange={setOpen}
    >
      <Button
        type='text'
        shape="circle"
        aria-label={ariaLabel}
        icon={<span style={{ fontSize: 22 }}>{icon}</span>}
        onClick={handleClick}
        style={{
          width: 40,
          height: 40
        }}
      />
    </Tooltip>
  );
}
