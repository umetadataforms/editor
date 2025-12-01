import React from 'react';
import { TitleFieldProps, getUiOptions } from '@rjsf/utils';

import LabelToolbar from './LabelToolbar';
import { getHeadingTag } from '../utils/template-utils';

export default function TitleFieldTemplate(props: TitleFieldProps) {

  const {
    id,
    required,
    title,
    uiSchema,
    registry: { formContext }
  } = props;


  const localUiOptions = getUiOptions(uiSchema) as any;

  const uiHeadingTag: string = localUiOptions?.headingTag ?? undefined;
  const uiIsTopLevel: boolean = localUiOptions?.isTopLevel ?? undefined;

  let { headingTag, headingClassName } = getHeadingTag(id);

  // To accomodate snake-case based field names in old schemas
  if (uiHeadingTag) {
    headingTag = uiHeadingTag;
    headingClassName = `x-${headingTag}`;
  }

  let isTopLevel = title && !!id && /^root_[^_]+__title$/.test(id);

  if (uiIsTopLevel) {
    isTopLevel = uiIsTopLevel;
  }

  // Derive the top-level field key from the id: root_field_subfield -> field
  let topFieldKey: string | null = null;
  // if (id.startsWith('root_')) {
  //   topFieldKey = id.replace(/^root_/, '').replace(/__title$/, '');
  // }
  if (isTopLevel) {
    topFieldKey = id.replace(/^root_/, '').replace(/__title$/, '');
  }

  let labelX: React.ReactNode | null = null;

  if (isTopLevel && topFieldKey) {
    labelX = React.createElement(
      headingTag,
      { className: `${headingClassName} x-label x-top-level` },
      <>
        <span>{title}</span>
        <LabelToolbar formContext={formContext} topFieldKey={topFieldKey} />
      </>
    );
  } else {
    labelX = React.createElement(
      headingTag,
      { className: `${headingClassName} x-label` },
      title
    );
  }

  const classNameX = `${required ? 'ant-form-item-required' : ''}`;

  const idNoTitle = id.replace(/__title$/, '');

  return title ? (
    <label
      htmlFor={idNoTitle}
      className={classNameX}>
      {title && labelX}
    </label>
  ) : null;
}
