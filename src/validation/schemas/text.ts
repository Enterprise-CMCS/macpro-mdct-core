import { isWhitespaceString } from "../../utils";
import { string } from "yup";
import { errors } from "../errors";

// Base for all text related schemas.
const nonWhitespaceText = string().test({
  test: (val) => !isWhitespaceString(val),
  message: errors.REQUIRED_GENERIC,
});

/*
 * Any string content used for FE validation or completion.
 * Validation fails if the string is a whitespace string (" ").
 */
export const nonWhitespaceTextRequired = nonWhitespaceText.required();

/*
 * Any optional string content used for FE validation or completion.
 * Validation fails if the string is a whitespace string (" ")
 */
export const nonWhitespaceTextOptional = nonWhitespaceText
  .nullable()
  .notRequired();

/*
 * The backend doesn't care what the content of the string is, because
 * we allow you to save incorrect states.
 */
export const anyText = string().nullable().notRequired();
