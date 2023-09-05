import { object } from "yup";
import { date, dateOptional, endDate } from "./date";

describe("Test date schema", () => {
  it("should correctly validate required dates", () => {
    const schema = date;
    expect(schema.isValidSync("01/01/2023")).toBe(true);
    expect(schema.isValidSync("1/1/1999")).toBe(false);
    expect(schema.isValidSync("01/99/10000")).toBe(false);
  });

  it("should correctly validate optional dates", () => {
    const schema = dateOptional;
    expect(schema.isValidSync("01/01/2023")).toBe(true);
    expect(schema.isValidSync("1/1/1999")).toBe(false);
    expect(schema.isValidSync("01/99/10000")).toBe(false);
    expect(schema.isValidSync(null)).toBe(true);
    expect(schema.isValidSync(undefined)).toBe(true);
  });

  it("should correctly validate end dates in comparison to start dates", () => {
    const schema = endDate("startDate");

    const nestedSchema = object({
      startDate: date,
      endDate: endDate("startDate"),
    });

    expect(
      nestedSchema.isValidSync({
        startDate: "01/01/2023",
        endDate: "01/01/2024",
      })
    ).toBe(true);

    expect(
      nestedSchema.isValidSync({
        startDate: "01/01/2024",
        endDate: "01/01/2023",
      })
    ).toBe(false);

    expect(
      nestedSchema.isValidSync({
        startDate: "",
        endDate: "01/01/2023",
      })
    ).toBe(false);
  });
});
