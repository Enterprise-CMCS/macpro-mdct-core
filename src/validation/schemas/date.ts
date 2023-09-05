import { TestContext, string } from "yup";
import { errors } from "../errors";
import { dateFormatRegex, isWhitespaceString } from "../../utils";

// DATE
export const dateSchemaBase = string()
  .matches(dateFormatRegex, errors.INVALID_DATE)
  .test({
    message: errors.REQUIRED_GENERIC,
    test: (value) => !isWhitespaceString(value),
  });

export const date = dateSchemaBase.required(errors.REQUIRED_GENERIC);
export const dateOptional = dateSchemaBase.nullable().notRequired();

export const endDate = (startDateField: string) =>
  date.test({
    name: "is-after-start-date",
    message: errors.INVALID_END_DATE,
    test: (endDateString: string | undefined, context: TestContext) => {
      const startDateString = context.parent[startDateField];
      const startDate = new Date(startDateString);
      const endDate = new Date(endDateString!);
      return endDate >= startDate;
    },
  });
