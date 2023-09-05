import { array, boolean, object } from "yup";
import { nonWhitespaceTextRequired } from "./text";
import { errors } from "../errors";

// CHECKBOX
const checkboxSchema = array()
  .min(1, errors.REQUIRED_CHECKBOX)
  .of(
    object()
      .shape({
        key: nonWhitespaceTextRequired,
        value: nonWhitespaceTextRequired,
      })
      .noUnknown()
  );

export const checkbox = checkboxSchema.required();
export const checkboxOptional = checkboxSchema.nullable().notRequired();
export const checkboxSingle = boolean();
