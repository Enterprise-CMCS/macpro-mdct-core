import { array, object } from "yup";
import { nonWhitespaceTextRequired } from "./text";
import { errors } from "../errors";

export const dynamic = array()
  .min(1)
  .of(
    object().shape({
      id: nonWhitespaceTextRequired,
      name: nonWhitespaceTextRequired,
    })
  )
  .required(errors.REQUIRED_GENERIC);
