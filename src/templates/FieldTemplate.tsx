/*!
 * SPDX-License-Identifier: Apache-2.0
 * @license Apache-2.
 *
 * Based on: @rjsf/antd FieldTemplate (v5.24.12)
 * Source repository: https://github.com/rjsf-team/react-jsonschema-form.git
 * Source file: packages/antd/src/templates/FieldTemplate/index.tsx
 * Upstream commit: 41d2d5553
 *
 * Changes: modified by Artur Akbarov.
 */

import React from 'react';
import {
  FieldTemplateProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  GenericObjectType,
  getTemplate,
  getUiOptions
} from '@rjsf/utils';

import { Form } from 'antd';

import LabelToolbar from './LabelToolbar';
import { getHeadingTag } from '../utils/template-utils';

const VERTICAL_LABEL_COL = { span: 24 };
const VERTICAL_WRAPPER_COL = { span: 24 };

/** The `FieldTemplate` component is the template used by `SchemaField` to render any field. It renders the field
 * content, (label, description, children, errors and help) inside of a `WrapIfAdditional` component.
 *
 * @param props - The `FieldTemplateProps` for this component
 */
export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldTemplateProps<T, S, F>) {

  const {
    children,
    classNames,
    style,
    description,
    disabled,
    displayLabel,
    errors,
    formContext,
    help,
    hidden,
    id,
    label,
    onDropPropertyClick,
    onKeyChange,
    rawErrors,
    rawDescription,
    rawHelp,
    readonly,
    registry,
    required,
    schema,
    uiSchema
    // onChange,
    // formData
  } = props;

  const {
    colon,
    labelCol = VERTICAL_LABEL_COL,
    wrapperCol = VERTICAL_WRAPPER_COL,
    wrapperStyle,
    descriptionLocation = 'below',
  } = formContext as GenericObjectType;

  const globalUiOptions = registry.globalUiOptions as any;
  const localUiOptions = getUiOptions<T, S, F>(uiSchema) as any;
  const uiOptions = { ...globalUiOptions, ...localUiOptions } as any;

  const WrapIfAdditionalTemplate = getTemplate<'WrapIfAdditionalTemplate', T, S, F>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions
  );

  if (hidden) {
    return <div className='field-hidden'>{children}</div>;
  }

  /* UI Options */

  const xLabelDisplay: boolean = uiOptions?.xLabelDisplay ?? displayLabel;

  const xFieldDescriptionDisplay: boolean = uiOptions?.xFieldDescriptionDisplay ?? true;
  let xFieldDescriptionLocation = uiOptions?.xFieldDescriptionLocation ?? descriptionLocation;

  // Needs uiOptions.__insideOneOf / __insideAnyOf (set by MultiSchemaField.tsx)
  const isMultiSchemaAlt = uiOptions.__insideOneOf || uiOptions.__insideAnyOf;

  const xMultiSchemaAltLabelDisplay: boolean =
    localUiOptions?.xLabelDisplay ??
    globalUiOptions?.xGlobalMultiSchemaAltLabelDisplay ??
    displayLabel;

  const xMultiSchemaAltDescriptionDisplay: boolean =
    localUiOptions?.xFieldDescriptionDisplay ??
    globalUiOptions?.xGlobalMultiSchemaAltDescriptionDisplay ??
    !!description;

  const xMultiSchemaAltDescriptionLocation: boolean =
    localUiOptions?.xFieldDescriptionLocation ??
    globalUiOptions?.xGlobalMultiSchemaAltDescriptionLocation ??
    descriptionLocation;

  const xObjectDescriptionDisplay: boolean = uiOptions?.xObjectDescriptionDisplay ?? true;
  const xArrayDescriptionDisplay: boolean = uiOptions?.xArrayDescriptionDisplay ?? true;

  const uiHeadingTag: string = localUiOptions?.headingTag ?? undefined;
  const uiIsTopLevel: boolean = localUiOptions?.isTopLevel ?? undefined;

  /* MultiSchema Alternative Field */

  let classNamesX = [classNames, isMultiSchemaAlt ? 'x-multi-schema-alt' : '']
    .filter(Boolean).join(' ');

  /* Label and Toolbar */

  const displayLabelX = isMultiSchemaAlt ? xMultiSchemaAltLabelDisplay : (xLabelDisplay ?? displayLabel);

  let { headingTag, headingClassName } = getHeadingTag(id);

  // To accomodate snake-case based field names in old schemas
  if (uiHeadingTag) {
    headingTag = uiHeadingTag
    headingClassName = `x-${headingTag}`
  }

  let isTopLevel = label && !!id && /^root_[^_]+$/.test(id);

  if (uiIsTopLevel) {
    isTopLevel = uiIsTopLevel;
  }

  // Derive the top-level field key from the id: root_field_subfield -> field
  let topFieldKey: string | null = null;
  // if (id && id.startsWith('root_')) {
  //   topFieldKey = id.replace(/^root_/, '').replace(/_.+/, '');
  // }
  if (isTopLevel) {
    // topFieldKey = id.replace(/^root_/, '').replace(/__title$/, '');
    topFieldKey = id.replace(/^root_/, '');
  }

  let labelX: React.ReactNode | null = null;

  if (isTopLevel && topFieldKey) {
    labelX = React.createElement(
      headingTag,
      { className: `${headingClassName} x-label x-top-level` },
      <>
        <span>{label}</span>
        <LabelToolbar formContext={formContext} topFieldKey={topFieldKey} />
      </>
    );
  } else {
    labelX = React.createElement(
      headingTag,
      { className: `${headingClassName} x-label` },
      label
    );
  }

  /* Description */

  let descriptionNode = rawDescription ? description : undefined;

  let hideDescription =
    (isMultiSchemaAlt && !xMultiSchemaAltDescriptionDisplay) ||
    (!isMultiSchemaAlt && !xFieldDescriptionDisplay);

  if (hideDescription) {
    descriptionNode = undefined;
  }

  const isObjOrArr = (() => {
    const t = schema?.type;
    if (Array.isArray(t)) return t.includes('object') || t.includes('array');
    return t === 'object' || t === 'array';
  })();

  // Hide field description for arrays and objects if already showing by their
  // own tempaltes.
  if ((isObjOrArr && xObjectDescriptionDisplay) ||
    (isObjOrArr && xArrayDescriptionDisplay)) {
    hideDescription = true;
  }

  let descriptionDisplayAbove: boolean = false;

  if (isMultiSchemaAlt) {
    xFieldDescriptionLocation = xMultiSchemaAltDescriptionLocation;
  }

  const descriptionProps: GenericObjectType = {};
  switch (xFieldDescriptionLocation) {
    case 'tooltip':
      if (descriptionNode) descriptionProps.tooltip = descriptionNode;
      break;
    case 'none':
      descriptionNode = undefined;
      break;
    case 'above': // above the field widget
      descriptionDisplayAbove = true;
      descriptionNode = undefined;
      break;
    case 'below':
      if (descriptionNode) descriptionProps.extra = descriptionNode;
      break;
    default:
      if (descriptionNode) descriptionProps.extra = descriptionNode;
      break;
  }

  /* Navigation Panel */

  // Add this small, anchor node for top-level fields used by the navigation
  // panel and App.css
  const anchorNode =
    isTopLevel && topFieldKey && !isMultiSchemaAlt ? (
      <div id={`anchor_${topFieldKey}`} className={`x-top-level-anchor ${id}`} />
    ) : null;

  return (
    <>
      {anchorNode}
      <WrapIfAdditionalTemplate
        classNames={classNamesX ?? classNames}
        style={style}
        disabled={disabled}
        id={id}
        label={label}
        onDropPropertyClick={onDropPropertyClick}
        onKeyChange={onKeyChange}
        readonly={readonly}
        required={required}
        schema={schema}
        uiSchema={uiSchema}
        registry={registry}
      >
        <Form.Item
          colon={colon}
          hasFeedback={schema.type !== 'array' && schema.type !== 'object'}
          help={(!!rawHelp && help) || (rawErrors?.length ? errors : undefined)}
          htmlFor={id}
          label={displayLabelX && labelX}
          labelCol={labelCol}
          required={required}
          style={wrapperStyle}
          validateStatus={rawErrors?.length ? 'error' : undefined}
          wrapperCol={wrapperCol}
          {...descriptionProps}
        >
          {!hideDescription && descriptionDisplayAbove && description}
          {children}
        </Form.Item>
      </WrapIfAdditionalTemplate>
    </>
  );
}
