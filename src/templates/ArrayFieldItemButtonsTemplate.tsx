import { memo } from 'react';
import type { MouseEvent } from 'react';
import type {
  ArrayFieldItemButtonsTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { buttonId } from '@rjsf/utils';
import type { UmfeFormContext } from '../types/form-context';

/** Renders array item action buttons with optional move controls.
 *
 * @param props - The `ArrayFieldItemButtonsTemplateProps` props for the component
 */

const ArrayFieldItemButtonsTemplate = memo(function ArrayFieldItemButtonsTemplate<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: ArrayFieldItemButtonsTemplateProps<T, S, F>) {
  const {
    disabled,
    hasCopy,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    fieldPathId,
    onCopyItem,
    onRemoveItem,
    onMoveDownItem,
    onMoveUpItem,
    readonly,
    registry,
    uiSchema,
  } = props;

  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;
  const showMoveButtons = registry.formContext?.showMoveButtons === true;

  const handleRemoveClick = (event: MouseEvent<HTMLButtonElement>) => {
    const itemElement = event.currentTarget.closest(
      '.rjsf-array-item, .umfe-collapsible-object-item'
    ) as HTMLElement | null;
    const clickY = event.clientY;
    const itemTop = itemElement?.getBoundingClientRect().top ?? clickY;

    const formContext = registry.formContext as UmfeFormContext | undefined;
    const removeTabularItem = formContext?.removeTabularItem;
    const path = fieldPathId.path;
    const kind = path[0] === 'fields' || path[0] === 'variables' ? path[0] : null;
    const localIndex = Number(path[1]);
    const topLevelTabularItem = kind && path.length === 2 && Number.isFinite(localIndex);

    if (topLevelTabularItem && removeTabularItem) {
      const pageSize = formContext?.tabularPageSize;
      const paging = formContext?.tabularPaging;
      let index = localIndex;
      if (kind === 'fields' && paging?.fields?.enabled && typeof pageSize === 'number') {
        index = paging.fields.page * pageSize + localIndex;
      }
      if (kind === 'variables' && paging?.variables?.enabled && typeof pageSize === 'number') {
        index = paging.variables.page * pageSize + localIndex;
      }
      removeTabularItem(kind, index);
    } else {
      onRemoveItem(event);
    }

    const delta = itemTop - clickY;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: window.scrollY + delta });
      });
    });
  };

  return (
    <>
      {showMoveButtons && (
        <MoveUpButton
          id={buttonId(fieldPathId, 'moveUp')}
          className="rjsf-array-item-move-up"
          disabled={disabled || readonly || !hasMoveUp}
          onClick={onMoveUpItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {showMoveButtons && (
        <MoveDownButton
          id={buttonId(fieldPathId, 'moveDown')}
          className="rjsf-array-item-move-down"
          disabled={disabled || readonly || !hasMoveDown}
          onClick={onMoveDownItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasCopy && (
        <CopyButton
          id={buttonId(fieldPathId, 'copy')}
          className="rjsf-array-item-copy"
          disabled={disabled || readonly}
          onClick={onCopyItem}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {hasRemove && (
        <RemoveButton
          id={buttonId(fieldPathId, 'remove')}
          className="rjsf-array-item-remove"
          disabled={disabled || readonly}
          onClick={handleRemoveClick}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
    </>
  );
});

export default ArrayFieldItemButtonsTemplate;
