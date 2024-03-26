import { checkboxSingle } from "./checkbox";
import { dropdown } from "./dropdown";
import { AnySchema } from "yup";

interface SchemaTypes {
  checkboxSingle: AnySchema;
  dropdown: AnySchema;
}

export const validationSchemaMap: SchemaTypes = {
  checkboxSingle: checkboxSingle,
  dropdown,
};
