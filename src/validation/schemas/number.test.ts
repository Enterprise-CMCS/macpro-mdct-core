import {
  numberNotLessThanN,
  numberOptional,
  numberOrNAOptional,
  numberOrNARequired,
  numberRequired,
} from "./number";

describe("Test number schema", () => {
  it("should correctly validate required number fields", () => {
    const schema = numberRequired;
    expect(schema.isValidSync("1000")).toBe(true);
    expect(schema.isValidSync("100,000")).toBe(true);
    expect(schema.isValidSync(",,,,,,,,")).toBe(false);
    expect(schema.isValidSync("")).toBe(false);
    expect(schema.isValidSync(undefined)).toBe(false);
    expect(schema.isValidSync(null)).toBe(false);
    expect(schema.isValidSync("!@#!@%")).toBe(false);
    expect(schema.isValidSync("abc")).toBe(false);
    expect(schema.isValidSync("$123")).toBe(true);
    expect(schema.isValidSync("1$23")).toBe(false);
    expect(schema.isValidSync("123%")).toBe(true);
    expect(schema.isValidSync("12%3")).toBe(false);
  });

  it("should correctly validate optional number fields", () => {
    const schema = numberOptional;
    expect(schema.isValidSync("1000")).toBe(true);
    expect(schema.isValidSync("100,000")).toBe(true);
    expect(schema.isValidSync(",,,,,,,,")).toBe(false);
    expect(schema.isValidSync("")).toBe(true);
    expect(schema.isValidSync(undefined)).toBe(true);
    expect(schema.isValidSync(null)).toBe(true);
    expect(schema.isValidSync("!@#!@%")).toBe(false);
    expect(schema.isValidSync("abc")).toBe(false);
  });

  it("should correctly validate required number or NA fields", () => {
    const schema = numberOrNARequired;
    expect(schema.isValidSync("1000")).toBe(true);
    expect(schema.isValidSync("100,000")).toBe(true);
    expect(schema.isValidSync(",,,,,,,,")).toBe(false);
    expect(schema.isValidSync("")).toBe(false);
    expect(schema.isValidSync(undefined)).toBe(false);
    expect(schema.isValidSync(null)).toBe(false);
    expect(schema.isValidSync("!@#!@%")).toBe(false);
    expect(schema.isValidSync("abc")).toBe(false);
    expect(schema.isValidSync("N/A")).toBe(true);
    expect(schema.isValidSync("Data not available")).toBe(true);
  });

  it("should correctly validate optional number or NA fields", () => {
    const schema = numberOrNAOptional;
    expect(schema.isValidSync("1000")).toBe(true);
    expect(schema.isValidSync("100,000")).toBe(true);
    expect(schema.isValidSync(",,,,,,,,")).toBe(false);
    expect(schema.isValidSync("")).toBe(true);
    expect(schema.isValidSync(undefined)).toBe(true);
    expect(schema.isValidSync(null)).toBe(true);
    expect(schema.isValidSync("!@#!@%")).toBe(false);
    expect(schema.isValidSync("abc")).toBe(false);
    expect(schema.isValidSync("N/A")).toBe(true);
    expect(schema.isValidSync("Data not available")).toBe(true);
  });

  it("should correctly validate number not less than n fields", () => {
    const schema = numberNotLessThanN(1);
    expect(schema.isValidSync("1")).toBe(true);
    expect(schema.isValidSync("2")).toBe(true);
    expect(schema.isValidSync("1000")).toBe(true);
    expect(schema.isValidSync("-1")).toBe(false);
    expect(schema.isValidSync("-1000")).toBe(false);
    expect(schema.isValidSync(",,,,,,,,")).toBe(false);
    expect(schema.isValidSync("")).toBe(false);
    expect(schema.isValidSync(undefined)).toBe(false);
    expect(schema.isValidSync(null)).toBe(false);
    expect(schema.isValidSync("!@#!@%")).toBe(false);
    expect(schema.isValidSync("abc")).toBe(false);
    expect(schema.isValidSync("N/A")).toBe(false);
    expect(schema.isValidSync("Data not available")).toBe(false);

    const schemaLessThan0 = numberNotLessThanN(0);
    expect(schemaLessThan0.isValidSync("0")).toBe(true);
    expect(schemaLessThan0.isValidSync("1")).toBe(true);
    expect(schemaLessThan0.isValidSync("1000")).toBe(true);
    expect(schemaLessThan0.isValidSync("-1")).toBe(false);
    expect(schemaLessThan0.isValidSync("-1000")).toBe(false);
    expect(schemaLessThan0.isValidSync(",,,,,,,,")).toBe(false);
    expect(schemaLessThan0.isValidSync("")).toBe(false);
    expect(schemaLessThan0.isValidSync(undefined)).toBe(false);
    expect(schemaLessThan0.isValidSync(null)).toBe(false);
    expect(schemaLessThan0.isValidSync("!@#!@%")).toBe(false);
    expect(schemaLessThan0.isValidSync("abc")).toBe(false);
    expect(schemaLessThan0.isValidSync("N/A")).toBe(false);
    expect(schemaLessThan0.isValidSync("Data not available")).toBe(false);
  });

  it("should throw an error when using an un-implemented numberLessThanN argument", () => {
    expect(() => numberNotLessThanN(2)).toThrowError("Not implemented");
  });
});
