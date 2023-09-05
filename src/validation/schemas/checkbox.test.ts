import { checkbox, checkboxOptional, checkboxSingle } from "./checkbox";

describe("Test checkbox schema", () => {
  it("should correctly validate checkbox values", () => {
    const schema = checkbox;
    expect(
      checkbox.isValidSync([
        {
          key: "foo",
          value: "bar",
        },
      ])
    ).toBe(true);
    expect(
      checkbox.isValidSync([
        {
          key: "foo",
        },
      ])
    ).toBe(false);
    expect(
      checkbox.isValidSync([
        {
          value: "bar",
        },
      ])
    ).toBe(false);
    expect(
      checkbox.isValidSync([
        {
          key: "",
          value: "bar",
        },
      ])
    ).toBe(false);
    expect(checkbox.isValidSync([])).toBe(false);
  });
  it("should correctly validate optional checkbox values", () => {
    const schema = checkboxOptional;
    expect(
      schema.isValidSync([
        {
          key: "foo",
          value: "bar",
        },
      ])
    ).toBe(true);
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
    expect(schema.isValidSync(null)).toBe(true);
    expect(schema.isValidSync(undefined)).toBe(true);
  });
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
