import { memo } from 'react';
import type { ElementType, ReactNode } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import type { FieldPathId } from '@rjsf/utils';
import Markdown from 'markdown-to-jsx';
import { ActionIcon, Tooltip } from '@mantine/core';
import { getHeadingTag, isTopLevelField } from '../utils/template-utils';
import { getDescriptionFirstLine } from '../utils/description-utils';
import FieldLabelToolbar from '../templates/FieldLabelToolbar';
import { useDescriptionPanel } from './Panels/DescriptionPanel';
import { useHeadingDepth } from './HeadingDepthContext';
import type { UmfeFormContext } from '../types/form-context';

type FieldHeaderProps = {
  label?: string;
  rawDescription?: string;
  fieldPathId: FieldPathId;
  optionalDataControl?: ReactNode;
  formContext?: UmfeFormContext;
  labelAddon?: ReactNode;
  required?: boolean;
};

/**
 * Renders a field header with label, optional toolbar, and description handling.
 *
 * Summary:
 * - Computes heading level from the heading depth context.
 * - Shows required marker, optional data controls, and context label when provided.
 * - For top-level fields, renders inline markdown descriptions.
 * - For nested fields, shows an info icon that opens the description
 *   panel using the description panel context.
 * - Adds anchors for top-level fields to support scroll targets.
 * - Wraps the label/action row with a heading-level class for spacing control.
 *
 * @param props - The `FieldHeaderProps` for this component
 */
const FieldHeader = memo(function FieldHeader({
  label,
  rawDescription,
  fieldPathId,
  optionalDataControl,
  formContext,
  labelAddon,
  required,
}: FieldHeaderProps) {
  const resolvedLabel = typeof label === 'string' ? label : '';
  const { depthOffset, forceNonTopLevel } = useHeadingDepth();
  const { headingTag, headingTagClassName } = getHeadingTag(fieldPathId, depthOffset);
  const isTopLevel = isTopLevelField(fieldPathId, depthOffset, forceNonTopLevel);
  const HeadingTag = headingTag as ElementType;

  const { openDescription } = useDescriptionPanel();

  const tooltipText = rawDescription ? getDescriptionFirstLine(rawDescription) : '';
  const hasDescription = !!rawDescription;

  const infoIcon = !isTopLevel && hasDescription ? (
    <Tooltip label={tooltipText} withArrow>
      <ActionIcon
        size="sm"
        radius="md"
        variant="subtle"
        aria-label="Show description"
        className="umfe-info-icon"
        onClick={() => openDescription({ title: resolvedLabel, description: rawDescription || '' })}
      >
        <IconInfoCircle size={18} />
      </ActionIcon>
    </Tooltip>
  ) : null;

  const topFieldKey = fieldPathId.path.length > 0 ? String(fieldPathId.path[0]) : 'root';
  const showTopToolbar = isTopLevel && fieldPathId.path.length > 0;
  const showAnchor = isTopLevel && fieldPathId.path.length > 0;
  const actions = showTopToolbar || optionalDataControl ? (
    <div className="umfe-label-actions">
      {showTopToolbar ? (
        <FieldLabelToolbar
          topFieldKey={topFieldKey}
          className="umfe-field-actions"
        />
      ) : null}
      {optionalDataControl}
    </div>
  ) : null;

  const contextLabel = (() => {
    const currentFormData = formContext?.currentFormDataRef?.current as
      | { fields?: Array<Record<string, unknown>>; files?: Array<Record<string, unknown>>; variables?: Array<Record<string, unknown>> }
      | null
      | undefined;
    const tabularPaging = formContext?.tabularPaging;
    const tabularPageSize = formContext?.tabularPageSize;
    const path = fieldPathId.path;
    const tagsIndex = path.findIndex((segment) => segment === 'tags');
    if (tagsIndex >= 0) return null;
    const fieldsIndex = path.findIndex((segment) => segment === 'fields');
    if (fieldsIndex >= 0 && path[fieldsIndex + 2] === 'resources') {
      const resourceItemIndex = Number(path[fieldsIndex + 3]);
      if (Number.isFinite(resourceItemIndex)) return null;
    }
    const filesIndex = path.findIndex((segment) => segment === 'files');
    if (fieldsIndex >= 0 && fieldsIndex + 1 < path.length) {
      const itemIndex = Number(path[fieldsIndex + 1]);
      if (Number.isFinite(itemIndex)) {
        const fieldsData = currentFormData?.fields;
        const globalIndex = tabularPaging?.fields?.enabled && tabularPageSize
          ? tabularPaging.fields.page * tabularPageSize + itemIndex
          : itemIndex;
        const label = typeof fieldsData?.[globalIndex]?.label === 'string'
          ? fieldsData[globalIndex].label.trim()
          : '';
        return label || 'No Label';
      }
    }
    if (filesIndex >= 0 && filesIndex + 1 < path.length) {
      const itemIndex = Number(path[filesIndex + 1]);
      if (Number.isFinite(itemIndex)) {
        const filesData = currentFormData?.files;
        const label = typeof filesData?.[itemIndex]?.label === 'string'
          ? filesData[itemIndex].label.trim()
          : '';
        return label || 'No Label';
      }
    }
    const variablesIndex = path.findIndex((segment) => segment === 'variables');
    if (variablesIndex >= 0 && variablesIndex + 1 < path.length) {
      const itemIndex = Number(path[variablesIndex + 1]);
      if (Number.isFinite(itemIndex)) {
        const variablesData = currentFormData?.variables;
        const globalIndex = tabularPaging?.variables?.enabled && tabularPageSize
          ? tabularPaging.variables.page * tabularPageSize + itemIndex
          : itemIndex;
        const label = typeof variablesData?.[globalIndex]?.label === 'string'
          ? variablesData[globalIndex].label.trim()
          : '';
        return label || 'No Label';
      }
    }
    return null;
  })();

  const previewKey = (() => {
    const path = fieldPathId.path;

    const getGlobalIndex = (kind: 'fields' | 'variables' | 'files', localIndex: number) => {
      if (kind === 'fields') {
        const tabularPage = formContext?.tabularPaging?.fields?.page;
        const enabled = formContext?.tabularPaging?.fields?.enabled;
        const pageSize = formContext?.tabularPageSize;
        if (enabled && typeof tabularPage === 'number' && typeof pageSize === 'number') {
          return tabularPage * pageSize + localIndex;
        }
      }
      if (kind === 'variables') {
        const tabularPage = formContext?.tabularPaging?.variables?.page;
        const enabled = formContext?.tabularPaging?.variables?.enabled;
        const pageSize = formContext?.tabularPageSize;
        if (enabled && typeof tabularPage === 'number' && typeof pageSize === 'number') {
          return tabularPage * pageSize + localIndex;
        }
      }
      return localIndex;
    };

    const itemKinds: Array<'fields' | 'files' | 'variables'> = ['fields', 'files', 'variables'];
    for (const kind of itemKinds) {
      const idx = path.findIndex((segment) => segment === kind);
      if (idx < 0 || idx + 1 >= path.length) continue;
      const localIndex = Number(path[idx + 1]);
      if (!Number.isFinite(localIndex)) continue;
      const itemIndex = getGlobalIndex(kind, localIndex);
      return `${kind}[${itemIndex}]`;
    }

    return path.length > 0 ? path.map((seg) => String(seg)).join('.') : 'root';
  })();

  if (!resolvedLabel.trim()) return null;

  return (
    <div className="umfe-field-header" data-preview-key={previewKey}>
      {showAnchor ? (
        <div id={`anchor_${topFieldKey}`} className="umfe-top-level-anchor" />
      ) : null}
      <div className="umfe-label-row">
        <div className={`umfe-label-block umfe-label-block-${headingTag}`}>
          <div className="umfe-label-group">
            <HeadingTag
              className={`${headingTagClassName} umfe-label${isTopLevel ? ' umfe-label-top-level' : ''}${required ? ' umfe-field-required' : ''}`}
            >
                {resolvedLabel}
            </HeadingTag>
            {infoIcon}
            {labelAddon}
            {contextLabel ? (
              <span className="umfe-field-context-label">{contextLabel}</span>
            ) : null}
          </div>
          {actions}
        </div>
      </div>
      {isTopLevel && hasDescription ? (
        <div className="umfe-description-inline">
          <Markdown options={{ disableParsingRawHTML: true }}>
            {rawDescription || ''}
          </Markdown>
        </div>
      ) : null}
    </div>
  );
});

export default FieldHeader;
