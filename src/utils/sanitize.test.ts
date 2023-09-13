import { sanitizeArray, sanitizeObject, sanitizeString } from "./sanitize";

var mockedLibrary: any;

jest.mock("dompurify", () => {
  return function (windowEmulator: any) {
    mockedLibrary = {
      ...jest.requireActual("dompurify")(windowEmulator),
    };
    return mockedLibrary;
  };
});

describe("Test sanitization utilities", () => {
  beforeAll(() => {
    mockedLibrary.isSupported = true;
  });

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
  it("should correctly sanitize nested arrays", () => {
    expect(
      sanitizeArray([
        [
          "<a href='&#x2000;javascript:alert(1)'>",
          "<a href='&#x2000;javascript:alert(2)'>",
        ],
      ])
    ).toEqual([["<a></a>", "<a></a>"]]);
  });
  it("should correctly sanitize an object", () => {
    expect(
      sanitizeObject({
        foo: "<a href='&#x2000;javascript:alert(1)'>",
        bar: "<a href='&#x2000;javascript:alert(2)'>",
      })
    ).toEqual({ foo: "<a></a>", bar: "<a></a>" });
  });
  it("should not alter non-strings", () => {
    expect(
      sanitizeObject({
        foo: false,
        bar: 5,
      })
    ).toEqual({ foo: false, bar: 5 });
  });
});

describe("test sanitization utilities in obsolete environments", () => {
  beforeAll(() => {
    mockedLibrary.isSupported = false;
  });

  it("should null out strings", () => {
    expect(sanitizeString("asdf")).toBeNull();
  });
  it("should null out strings in arrays", () => {
    expect(sanitizeArray(["asdf", 5])).toEqual([null, 5]);
  });
  it("should null out string properties of objects", () => {
    expect(sanitizeObject({ foo: "asdf", bar: 5 })).toEqual({
      foo: null,
      bar: 5,
    });
  });
});
