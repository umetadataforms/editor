import type {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema
} from '@rjsf/utils';
import { TranslatableString } from '@rjsf/utils';
import { IconPlus } from '@tabler/icons-react';
import IconButton from './IconButton';
import { getTooltipText, withTooltip } from './IconButton';

/** The `AddButton` renders a button that represents the add action.
 */
export default function AddButton<T = unknown, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  props: IconButtonProps<T, S, F>,
) {
  const {
    registry: { translateString },
  } = props;
  const tooltipText = getTooltipText(props, translateString(TranslatableString.AddItemButton), 'Add');
  const button = (
    <IconButton title={tooltipText} variant='subtle' {...props} icon={<IconPlus size={16} />} />
  );
  return withTooltip(tooltipText, button);
}
