import {
  DescriptionFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  getUiOptions,
} from '@rjsf/utils';

import Markdown from 'markdown-to-jsx';

export default function DescriptionFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: DescriptionFieldProps<T, S, F>) {
  const { description, uiSchema, registry } = props;
  if (!description) return null;

  const globalUiOptions = registry.globalUiOptions as any;
  const localUiOptions = getUiOptions<T, S, F>(uiSchema) as any;
  const uiOptions = { ...globalUiOptions, ...localUiOptions } as any;

  let xDescriptionAsDetails: boolean =
    (uiOptions as any).xDescriptionAsDetails ?? false;

  let xDescriptionAsDetailsOpen: boolean =
    (uiOptions as any).xDescriptionAsDetailsOpen ?? false;

  const xMultiSchemaAltDescriptionAsDetails: boolean =
    localUiOptions?.xDescriptionAsDetails ??
    globalUiOptions?.xGlobalMultiSchemaAltDescriptionAsDetails ??
    false;

  const xMultiSchemaAltDescriptionAsDetailsOpen: boolean =
    localUiOptions?.xDescriptionAsDetailsOpen ??
    globalUiOptions?.xGlobalMultiSchemaAltDescriptionAsDetailsOpen ??
    false;

  // Needs uiOptions.__insideOneOf / __insideAnyOf (set by MultiSchemaField.tsx)
  const isMultiSchemaAlt = uiOptions.__insideOneOf || uiOptions.__insideAnyOf;

  if (isMultiSchemaAlt) {
    xDescriptionAsDetails = xMultiSchemaAltDescriptionAsDetails;
    xDescriptionAsDetailsOpen = xMultiSchemaAltDescriptionAsDetailsOpen;
  }

  const content =
    typeof description === 'string'
      ? <Markdown>{description}</Markdown>
      : description;

  return (
    <div className="x-description">
      {xDescriptionAsDetails ? (
        <details {...(xDescriptionAsDetailsOpen ? { open: true } : {})}>
          <summary>Description</summary>
          {content}
        </details>
      ) : (
        content
      )}
    </div>
  );
}
