// Base for all number schemas.

import { string } from "yup";
import {
  checkStandardNumberInputAgainstRegexes,
  isWhitespaceString,
  validNAValues,
} from "../../utils";
import { errors } from "../errors";

// Since numbers come in as strings, check to see if they are valid numbers.
const numberSchema = string().test({
  test: (value) => {
    if (value) {
      return (
        !isWhitespaceString(value) &&
        checkStandardNumberInputAgainstRegexes(value)
      );
    }
    return true;
  },
  message: errors.INVALID_NUMBER,
});

const numberOrNASchema = string().test({
  test: (value) => {
    if (value) {
      const isValidString = validNAValues.includes(value);
      const isValidNumber = checkStandardNumberInputAgainstRegexes(value);
      return isValidString || isValidNumber;
    }
    return true;
  },
  message: errors.INVALID_NUMBER,
});

export const numberRequired = numberSchema.required();

export const numberOptional = numberSchema.nullable().notRequired();

export const numberOrNARequired = numberOrNASchema.required();

export const numberOrNAOptional = numberOrNASchema.nullable().notRequired();

export const anyNumber = string();

export const numberNotLessThanN = (n: number) => {
  switch (n) {
    case 0: {
      return numberSchema.test({
        test: (value) => {
          if (value) {
            return parseFloat(value) >= n;
          } else {
            return false;
          }
        },
        message: errors.NUMBER_LESS_THAN_ZERO,
      });
    }
    case 1: {
      return numberSchema.test({
        test: (value) => {
          if (value) {
            return parseFloat(value) >= n;
          } else {
            return false;
          }
        },
        message: errors.NUMBER_LESS_THAN_ONE,
      });
    }
    default:
      throw Error("Not implemented");
  }
};
