import BaseInputTemplate from '../templates/BaseInputTemplate';
import DescriptionField from '../templates/DescriptionField';
import FieldTemplate from '../templates/FieldTemplate';
import ObjectFieldTemplate from '../templates/ObjectFieldTemplate';
import ArrayFieldTemplate from '../templates/ArrayFieldTemplate';
import ArrayFieldItemTemplate from '../templates/ArrayFieldItemTemplate';
import ArrayFieldItemButtonsTemplate from '../templates/ArrayFieldItemButtonsTemplate';
import buttonTemplates from '../templates/ButtonTemplates';
import MultiSchemaField from '../fields/MultiSchemaField';
import CheckboxWidget from '../widgets/CheckboxWidget';
import InlineLabelCheckboxWidget from '../widgets/InlineLabelCheckboxWidget';
import NotApplicableWidget from '../widgets/NotApplicableWidget';
import StringFieldWidget from '../widgets/StringFieldWidget';
import TextAreaWidget from '../widgets/TextAreaWidget/TextAreaWidget';
import UnknownWidget from '../widgets/UnknownWidget';
import CountryWidget from '../widgets/CountryWidget';
import CountrySubdivisionWidget from '../widgets/CountrySubdivisionWidget';
import CountryWidgetTempAlpha3 from '../widgets/CountryWidgetTempAlpha3';

export const TEMPLATES = {
  DescriptionField,
  BaseInputTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
  ArrayFieldTemplate,
  ArrayFieldItemTemplate,
  ArrayFieldItemButtonsTemplate,
  ButtonTemplates: buttonTemplates(),
} as const;

export const FIELDS = {
  OneOfField: MultiSchemaField,
  AnyOfField: MultiSchemaField,
} as const;

export const WIDGETS = {
  CheckboxWidget,
  CountryWidget,
  CountrySubdivisionWidget,
  CountryWidgetTempAlpha3,
  InlineLabelCheckboxWidget,
  NotApplicableWidget,
  TextWidget: StringFieldWidget,
  text: StringFieldWidget,
  uri: StringFieldWidget,
  url: StringFieldWidget,
  email: StringFieldWidget,
  TextAreaWidget,
  UnknownWidget,
} as const;
