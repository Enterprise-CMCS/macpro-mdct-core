import { dynamic } from "./dynamic";

describe("Test dynamic schema", () => {
  it("should correctly validate dynamic field items", () => {
    const schema = dynamic;
    expect(
      schema.isValidSync([
        {
          id: "foo",
          name: "bar",
        },
      ])
    ).toBe(true);
    expect(
      schema.isValidSync([
        {
          id: "foo",
          name: "bar",
        },
        {
          id: "foo",
          name: "bar",
        },
      ])
    ).toBe(true);
    expect(
      schema.isValidSync([
        {
          id: "",
          name: "bar",
        },
      ])
    ).toBe(false);
    expect(
      schema.isValidSync([
        {
          id: "foo",
          name: "",
        },
      ])
    ).toBe(false);
    expect(schema.isValidSync([])).toBe(false);
    expect(
      schema.isValidSync([
        {
          id: null,
          name: "bar",
        },
      ])
    ).toBe(false);
    expect(
      schema.isValidSync([
        {
          name: "bar",
        },
      ])
    ).toBe(false);
    expect(schema.isValidSync(undefined)).toBe(false);
    expect(schema.isValidSync(null)).toBe(false);
  });
});
