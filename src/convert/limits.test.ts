import { describe, expect, it } from "vitest";
import {
  assertFileSize,
  assertImageDimensions,
  errorMessage,
  FILE_TOO_LARGE_MESSAGE,
  GENERIC_CONVERT_ERROR,
  IMAGE_TOO_LARGE_MESSAGE,
  MAX_FILE_BYTES,
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_PIXELS,
} from "./limits";

describe("errorMessage", () => {
  it("surfaces Error.message for invalid data files", () => {
    expect(errorMessage(new Error("This JSON file is not valid."))).toBe(
      "This JSON file is not valid.",
    );
    expect(errorMessage(new Error("This XML file is not valid."))).toBe(
      "This XML file is not valid.",
    );
    expect(errorMessage(new Error("This CSV file is not valid."))).toBe(
      "This CSV file is not valid.",
    );
  });

  it("falls back when there is no useful message", () => {
    expect(errorMessage({})).toBe(GENERIC_CONVERT_ERROR);
    expect(errorMessage(new Error("  "))).toBe(GENERIC_CONVERT_ERROR);
  });
});

describe("size and dimension caps", () => {
  it("rejects oversized files", () => {
    const huge = new File(["{}"], "n.json", { type: "application/json" });
    Object.defineProperty(huge, "size", { value: MAX_FILE_BYTES + 1 });
    expect(() => assertFileSize(huge)).toThrow(FILE_TOO_LARGE_MESSAGE);
  });

  it("accepts files at the size cap", () => {
    const ok = new File(["{}"], "n.json", { type: "application/json" });
    Object.defineProperty(ok, "size", { value: MAX_FILE_BYTES });
    expect(() => assertFileSize(ok)).not.toThrow();
  });

  it("rejects oversized image dimensions", () => {
    expect(() => assertImageDimensions(MAX_IMAGE_DIMENSION + 1, 10)).toThrow(
      IMAGE_TOO_LARGE_MESSAGE,
    );
    expect(() => assertImageDimensions(10, MAX_IMAGE_DIMENSION + 1)).toThrow(
      IMAGE_TOO_LARGE_MESSAGE,
    );
  });

  it("rejects images whose pixel count is too high", () => {
    const side = Math.ceil(Math.sqrt(MAX_IMAGE_PIXELS)) + 1;
    expect(side).toBeLessThanOrEqual(MAX_IMAGE_DIMENSION);
    expect(() => assertImageDimensions(side, side)).toThrow(IMAGE_TOO_LARGE_MESSAGE);
  });

  it("accepts images within both caps", () => {
    expect(() => assertImageDimensions(MAX_IMAGE_DIMENSION, 1)).not.toThrow();
    expect(() => assertImageDimensions(4096, 4096)).not.toThrow();
  });
});
