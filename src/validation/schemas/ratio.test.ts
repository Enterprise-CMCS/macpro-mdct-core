import { ratio, ratioOptional } from "./ratio";

describe("Test ratio schema", () => {
  it("should correctly validate ratio field items", () => {
    const schema = ratio;
    expect(schema.isValidSync("1:1")).toBe(true);
    expect(schema.isValidSync("1000:12")).toBe(true);
    expect(schema.isValidSync("1.25:12.000009999")).toBe(true);
    expect(schema.isValidSync("0:0")).toBe(true);
    expect(schema.isValidSync("-1:1")).toBe(true);
    expect(schema.isValidSync("1000:")).toBe(false);
    expect(schema.isValidSync(":12")).toBe(false);
    expect(schema.isValidSync(":")).toBe(false);
    expect(schema.isValidSync("::")).toBe(false);
    expect(schema.isValidSync("123")).toBe(false);
    expect(schema.isValidSync(null)).toBe(false);
    expect(schema.isValidSync(undefined)).toBe(false);
  });

  it("should correctly validate ratioOptional field items", () => {
    const schema = ratioOptional;
    expect(schema.isValidSync("1:1")).toBe(true);
    expect(schema.isValidSync("1000:12")).toBe(true);
    expect(schema.isValidSync("1.25:12.000009999")).toBe(true);
    expect(schema.isValidSync("0:0")).toBe(true);
    expect(schema.isValidSync("-1:1")).toBe(true);
    expect(schema.isValidSync("1000:")).toBe(false);
    expect(schema.isValidSync(":12")).toBe(false);
    expect(schema.isValidSync(":")).toBe(false);
    expect(schema.isValidSync("::")).toBe(false);
    expect(schema.isValidSync("123")).toBe(false);
    expect(schema.isValidSync(null)).toBe(true);
    expect(schema.isValidSync(undefined)).toBe(true);
  });
});
