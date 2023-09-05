import { sanitizeArray, sanitizeObject, sanitizeString } from "./sanitize";

describe("Test sanitization utilities", () => {
  it("should correctly sanitize strings", () => {
    expect(sanitizeString("<a href='&#x2000;javascript:alert(1)'>")).toEqual(
      "<a></a>"
    );
  });
  it("should correctly sanitize an array", () => {
    expect(
      sanitizeArray([
        "<a href='&#x2000;javascript:alert(1)'>",
        "<a href='&#x2000;javascript:alert(2)'>",
      ])
    ).toEqual(["<a></a>", "<a></a>"]);
  });
  it("should correctly sanitize an object", () => {
    expect(
      sanitizeObject({
        foo: "<a href='&#x2000;javascript:alert(1)'>",
        bar: "<a href='&#x2000;javascript:alert(2)'>",
      })
    ).toEqual({ foo: "<a></a>", bar: "<a></a>" });
  });
});
