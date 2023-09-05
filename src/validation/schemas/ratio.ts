import { mixed, number } from "yup";
import { errors } from "../errors";

const ratioSchema = mixed().test({
  test: validateRatioSchema,
  message: errors.INVALID_RATIO,
});

const ratioSchemaOptional = mixed().test({
  test: validateRatioSchemaOptional,
  message: errors.INVALID_RATIO,
});

export const ratio = ratioSchema.required();
export const ratioOptional = ratioSchemaOptional;

function validateRatioSchema(ratio: string) {
  if (!ratio) return false;
  const ratioCharacterRegex = /[,.:]/g;
  const ratioElements = ratio.split(":");

  // Double check and make sure that a ratio contains numbers on both sides
  if (
    !ratioElements ||
    ratioElements.length != 2 ||
    ratioElements[0].trim().length == 0 ||
    ratioElements[1].trim().length == 0
  ) {
    return false;
  }

  const validationResults = ratioElements.map((side) => {
    return number()
      .transform(() => Number(side.replace(ratioCharacterRegex, "")))
      .isValidSync(true);
  });

  return validationResults.every((result) => result);
}

function validateRatioSchemaOptional(ratio: string) {
  if (!ratio) return true;
  const ratioCharacterRegex = /[,.:]/g;
  const ratioElements = ratio.split(":");

  // Double check and make sure that a ratio contains numbers on both sides
  if (
    ratioElements.length != 2 ||
    ratioElements[0].trim().length == 0 ||
    ratioElements[1].trim().length == 0
  ) {
    return false;
  }

  const validationResults = ratioElements.map((side) => {
    return number()
      .transform(() => Number(side.replace(ratioCharacterRegex, "")))
      .isValidSync(true);
  });

  return validationResults.every((result) => result);
}
