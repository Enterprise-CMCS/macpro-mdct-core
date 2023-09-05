import { radio } from "./radio";

describe("Test radio schema", () => {
  it("should correctly validate radio field items", () => {
    const schema = radio;
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
          key: "",
          value: "bar",
        },
      ])
    ).toBe(false);
    expect(
      schema.isValidSync([
        {
          key: "foo",
          value: "",
        },
      ])
    ).toBe(false);
    expect(
      schema.isValidSync([
        {
          key: null,
          value: "",
        },
      ])
    ).toBe(false);
    expect(
      schema.isValidSync([
        {
          key: "foo",
          value: null,
        },
      ])
    ).toBe(false);
    expect(
      schema.isValidSync([
        {
          value: null,
        },
      ])
    ).toBe(false);
    expect(schema.isValidSync([])).toBe(false);
  });
});
