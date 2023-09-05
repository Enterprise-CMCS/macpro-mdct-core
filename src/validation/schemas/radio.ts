import { array, object } from "yup";
import { nonWhitespaceTextRequired } from "./text";
import { errors } from "../errors";

// RADIO
const radioSchema = array()
  .of(
    object({
      key: nonWhitespaceTextRequired,
      value: nonWhitespaceTextRequired,
    })
  )
  .min(0);

export const radio = radioSchema.min(1, errors.REQUIRED_GENERIC).required();
export const radioOptional = radioSchema.notRequired().nullable();
