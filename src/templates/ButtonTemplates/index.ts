import type {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType
} from '@rjsf/utils';
import SubmitButton from './SubmitButton';
import AddButton from './AddButton';
import {
  CopyButton,
  MoveDownButton,
  MoveUpButton,
  RemoveButton,
  ClearButton
} from './IconButton';

/**
 * Button template bundle for Mantine.
 *
 * Changes from upstream: centralises button rendering and tooltip handling via
 * `ui:options.tooltipSuffix`, so all item buttons share consistent styling and
 * tooltip text across arrays and objects.
 */
function buttonTemplates<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(): TemplatesType<T, S, F>['ButtonTemplates'] {
  return {
    SubmitButton,
    AddButton,
    CopyButton,
    MoveDownButton,
    MoveUpButton,
    RemoveButton,
    ClearButton,
  };
}

export default buttonTemplates;
