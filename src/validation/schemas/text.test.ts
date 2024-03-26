import {
  anyText,
  nonWhitespaceTextOptional,
  nonWhitespaceTextRequired,
} from "./text";

describe("Test text schema", () => {
  it("should correctly validate non whitespace text field items", () => {
    const schema = nonWhitespaceTextRequired;
    expect(schema.isValidSync("foo")).toBe(true);
    expect(schema.isValidSync("123")).toBe(true);
    expect(schema.isValidSync("")).toBe(false);
    expect(schema.isValidSync(null)).toBe(false);
    expect(schema.isValidSync(undefined)).toBe(false);
  });
  it("should correctly validate optional text field items", () => {
    const schema = nonWhitespaceTextOptional;
    expect(schema.isValidSync("foo")).toBe(true);
    expect(schema.isValidSync("123")).toBe(true);
    expect(schema.isValidSync("")).toBe(true);
    expect(schema.isValidSync(null)).toBe(true);
    expect(schema.isValidSync(undefined)).toBe(true);
  });

  it("should correctly validate anyText field items", () => {
    const schema = anyText;
    expect(schema.isValidSync("test")).toBe(true);
    expect(schema.isValidSync("")).toBe(true);
    expect(schema.isValidSync(null)).toBe(true);
    expect(schema.isValidSync(undefined)).toBe(true);
  });
});
