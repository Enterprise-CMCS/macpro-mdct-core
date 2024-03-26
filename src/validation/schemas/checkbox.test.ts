import { checkboxSingle } from "./checkbox";

describe("Test checkbox schema", () => {
  it("should correctly validate single checkbox values", () => {
    const schema = checkboxSingle;
    expect(
      schema.isValidSync([
        {
          key: "foo",
          value: "bar",
        },
      ])
    ).toBe(false);
    expect(
      schema.isValidSync([
        {
          key: "foo",
        },
      ])
    ).toBe(false);
    expect(
      schema.isValidSync([
        {
          value: "bar",
        },
      ])
    ).toBe(false);
    expect(schema.isValidSync([])).toBe(false);
    expect(schema.isValidSync(null)).toBe(false);
    expect(schema.isValidSync(false)).toBe(true);
    expect(schema.isValidSync(true)).toBe(true);
  });
});
