import { afterEach, describe, expect, it, vi } from "vitest";
import { IMAGE_TOO_LARGE_MESSAGE, MAX_IMAGE_DIMENSION } from "../limits";
import { loadBitmap } from "./image";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function pngFile(): File {
  return new File(["x"], "tiny.png", { type: "image/png" });
}

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 2;
  naturalHeight = 2;
  set src(_url: string) {
    queueMicrotask(() => this.onload?.());
  }
}

describe("loadBitmap", () => {
  it("never calls createImageBitmap when it is not a function", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    vi.stubGlobal("Image", FakeImage);

    const loaded = await loadBitmap(pngFile());
    expect(typeof globalThis.createImageBitmap).not.toBe("function");
    expect(loaded).toHaveProperty("naturalWidth", 2);
    expect(loaded).toHaveProperty("naturalHeight", 2);
  });

  it("rejects oversized images from createImageBitmap", async () => {
    const close = vi.fn();
    vi.stubGlobal("createImageBitmap", async () => ({
      width: MAX_IMAGE_DIMENSION + 1,
      height: 8,
      close,
    }));

    await expect(loadBitmap(pngFile())).rejects.toThrow(IMAGE_TOO_LARGE_MESSAGE);
    expect(close).toHaveBeenCalled();
  });

  it("rejects oversized images on the Image fallback path", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    vi.stubGlobal(
      "Image",
      class OversizedImage extends FakeImage {
        naturalWidth = MAX_IMAGE_DIMENSION + 1;
        naturalHeight = 8;
      },
    );

    await expect(loadBitmap(pngFile())).rejects.toThrow(IMAGE_TOO_LARGE_MESSAGE);
  });
});
