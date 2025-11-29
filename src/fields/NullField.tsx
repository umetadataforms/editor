import { useEffect } from "react";
import { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";
import { getWidget, getUiOptions } from "@rjsf/utils";

export default function NullFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldProps<T, S, F>) {
  const { formData, onChange } = props;

  // Ensure the form value is actually null once mounted
  useEffect(() => {
    if (formData === undefined) {
      onChange(null as unknown as T);
    }
  }, [formData, onChange]);

  const { idSchema, schema, uiSchema, registry, required, rawErrors } = props;
  const id = idSchema.$id;

  const uiOptions = getUiOptions<T, S, F>(uiSchema, registry.globalUiOptions);

  const widgetName: string = 'text';
  let widgetSchema: RJSFSchema = { ...schema, type: "string" } as S;

  const Widget = getWidget<T, S, F>(widgetSchema as S, widgetName, registry.widgets);

  return (
    <Widget
      id={id}
      name={id}
      schema={widgetSchema as S}
      options={{ ...uiOptions }}
      placeholder={'null'}
      label={schema.title ?? ""}
      required={!!required}
      rawErrors={rawErrors}
      value={''}
      disabled={true}
      readOnly={true}
      onChange={() => {}}
      onBlur={(_id: string, _val: any) => {}}
      onFocus={(_id: string, _val: any) => {}}
      registry={registry}
      uiSchema={uiSchema}
      formContext={props.formContext}
    />
  );
}
