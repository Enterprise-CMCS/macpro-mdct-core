import {
  anyText,
  nonWhitespaceTextOptional,
  nonWhitespaceTextRequired,
} from "./text";
import { ratio, ratioOptional } from "./ratio";
import { numberRequired, numberOptional, numberNotLessThanN } from "./number";
import { date, dateOptional, endDate } from "./date";
import { checkbox, checkboxOptional, checkboxSingle } from "./checkbox";
import { dropdown } from "./dropdown";
import { dynamic } from "./dynamic";
import { nested } from "./nested";
import { radio, radioOptional } from "./radio";
import { AnySchema } from "yup";

interface SchemaTypes {
  checkbox: AnySchema;
  checkboxOptional: AnySchema;
  checkboxSingle: AnySchema;
  date: AnySchema;
  dateOptional: AnySchema;
  dropdown: AnySchema;
  dynamic: AnySchema;
  endDate: Function;
  nested: Function;
  number: AnySchema;
  numberOptional: AnySchema;
  numberNotLessThanOne: AnySchema;
  numberNotLessThanZero: AnySchema;
  radio: AnySchema;
  radioOptional: AnySchema;
  ratio: AnySchema;
  ratioOptional: AnySchema;
  text: AnySchema;
  textOptional: AnySchema;
}

export const validationSchemaMap: SchemaTypes = {
  checkbox: checkbox,
  checkboxOptional: checkboxOptional,
  checkboxSingle: checkboxSingle,
  date,
  dateOptional: dateOptional,
  dropdown,
  dynamic,
  endDate,
  nested,
  number: numberRequired,
  numberOptional,
  numberNotLessThanOne: numberNotLessThanN(1),
  numberNotLessThanZero: numberNotLessThanN(0),
  radio: radio,
  radioOptional: radioOptional,
  ratio,
  ratioOptional,
  text: nonWhitespaceTextRequired,
  textOptional: nonWhitespaceTextOptional,
};

export const persistenceSchemaMap: SchemaTypes = {
  checkbox: checkbox,
  checkboxOptional: checkboxOptional,
  checkboxSingle: checkboxSingle,
  date: anyText,
  dateOptional: anyText,
  dropdown,
  dynamic,
  nested,
  number: anyText,
  numberOptional: anyText,
  numberNotLessThanOne: numberNotLessThanN(1),
  numberNotLessThanZero: numberNotLessThanN(0),
  endDate: () => anyText,
  radio,
  radioOptional,
  ratio,
  ratioOptional,
  text: anyText,
  textOptional: anyText,
};
