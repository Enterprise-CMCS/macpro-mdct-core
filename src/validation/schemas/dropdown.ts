import { object } from "yup";
import { nonWhitespaceTextRequired } from "./text";
import { errors } from "../errors";

// DROPDOWN
export const dropdown = object({
  label: nonWhitespaceTextRequired,
  value: nonWhitespaceTextRequired,
}).required(errors.REQUIRED_GENERIC);
