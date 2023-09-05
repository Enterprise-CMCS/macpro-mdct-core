export const whitespaceStringRegex = /^\s+$/;

export const dateFormatRegex =
  /^((0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2})|((0[1-9]|1[0-2])(0[1-9]|1\d|2\d|3[01])(19|20)\d{2})$/;

// basic check for all possible characters -- standard number
export const validCharactersStandardNumberRegex = /^[0-9\s.,$%-]+$/;
// basic check for all possible characters -- ratio
export const validCharactersRatioNumberRegex = /^[0-9.,-]+$/;
// at most 1 decimal point
export const atMost1DecimalPointRegex = /^[^.]*\.?[^.]*$/;
// commas only exist before decimal point
export const validCommaLocationRegex = /^[0-9,$-]*\.?[0-9%]*$/;
// at most 1 $%
export const atMost1SpecialCharacterRegex =
  /^([^$%]*\$[^$%]*|[^$%]*%[^$%]*|[^$%]*)$/;
// at most 1 $ at the beginning of the input
export const validDollarSignPlacementRegex = /^[$]?[^$%]+$/;
// at most 1 % at the end of the input
export const validPercentSignPlacementRegex = /^[^%$]+[%]?$/;
// at most 1 - at the beginning of the input (but after any potential $s)
export const validNegativeSignPlacementRegex = /^[$]?[-]?[^$-]+[%]?$/;
// exactly one ratio character in between other characters
export const exactlyOneRatioCharacterRegex = /^[^:]+:[^:]+$/;
// no multiple commas next to each other
export const multipleCommasRegex = /^.*?,,+.*$/;

export const checkStandardNumberInputAgainstRegexes = (
  value: string
): boolean => {
  if (
    !validCharactersStandardNumberRegex.test(value) ||
    !atMost1DecimalPointRegex.test(value) ||
    !validCommaLocationRegex.test(value) ||
    !atMost1SpecialCharacterRegex.test(value) ||
    !(
      validDollarSignPlacementRegex.test(value) ||
      validPercentSignPlacementRegex.test(value)
    ) ||
    !validNegativeSignPlacementRegex.test(value) ||
    multipleCommasRegex.test(value)
  )
    return false;
  return true;
};
