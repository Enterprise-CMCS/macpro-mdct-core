import {
  anyText,
  email,
  nonWhitespaceTextOptional,
  nonWhitespaceTextRequired,
  url,
  urlOptional,
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

  it("should correctly validate email field items", () => {
    const schema = email;
    expect(schema.isValidSync("test@test.com")).toBe(true);
    expect(schema.isValidSync("test")).toBe(false);
    expect(schema.isValidSync("")).toBe(false);
    expect(schema.isValidSync(null)).toBe(false);
    expect(schema.isValidSync(undefined)).toBe(false);
  });
  it("should correctly validate url field items", () => {
    const schema = url;
    expect(schema.isValidSync("https://www.test.com")).toBe(true);
    expect(schema.isValidSync("http://www.test.net")).toBe(true);
    expect(schema.isValidSync("https://www.")).toBe(false);
    expect(schema.isValidSync("test")).toBe(false);
    expect(schema.isValidSync("")).toBe(false);
    expect(schema.isValidSync(null)).toBe(false);
    expect(schema.isValidSync(undefined)).toBe(false);
  });
  it("should correctly validate url optional field items", () => {
    const schema = urlOptional;
    expect(schema.isValidSync("https://www.test.com")).toBe(true);
    expect(schema.isValidSync("http://www.test.net")).toBe(true);
    expect(schema.isValidSync("https://www.")).toBe(false);
    expect(schema.isValidSync("test")).toBe(false);
    expect(schema.isValidSync("")).toBe(true);
    expect(schema.isValidSync(null)).toBe(true);
    expect(schema.isValidSync(undefined)).toBe(true);
  });
});
