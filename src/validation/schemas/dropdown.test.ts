import { dropdown } from "./dropdown";

describe("Test dropdown schema", () => {
  it("should correctly validate dropdown field items", () => {
    const schema = dropdown;
    expect(
      schema.isValidSync({
        label: "Label",
        value: "Value",
      })
    ).toBe(true);
    expect(
      schema.isValidSync({
        label: "",
        value: "Value",
      })
    ).toBe(false);
    expect(
      schema.isValidSync({
        label: "Label",
        value: "",
      })
    ).toBe(false);
    expect(schema.isValidSync(null)).toBe(false);
    expect(schema.isValidSync(undefined)).toBe(false);
  });
});
