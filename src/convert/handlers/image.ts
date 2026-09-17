import { assertImageDimensions } from "../limits";
import type { ProgressFn, TargetFormat } from "../types";
import { report } from "../progress";

const IMAGE_MIME: Record<"png" | "jpeg" | "webp", string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export type LoadedImage = ImageBitmap | HTMLImageElement;

function closeImage(image: LoadedImage): void {
  if ("close" in image) image.close();
}

function sourceSize(image: LoadedImage): { width: number; height: number } {
  if ("naturalWidth" in image) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }
  return { width: image.width, height: image.height };
}

export async function loadBitmap(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    try {
      assertImageDimensions(bitmap.width, bitmap.height);
      return bitmap;
    } catch (err) {
      closeImage(bitmap);
      throw err;
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Couldn't read this image."));
      img.src = url;
    });
    assertImageDimensions(image.naturalWidth, image.naturalHeight);
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function convertImage(
  file: File,
  target: Extract<TargetFormat, "png" | "jpeg" | "webp">,
  onProgress?: ProgressFn,
): Promise<Blob> {
  report(onProgress, 12);
  const bitmap = await loadBitmap(file);
  report(onProgress, 45);

  const { width, height } = sourceSize(bitmap);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    closeImage(bitmap);
    throw new Error("Canvas is not available in this browser.");
  }

  if (target === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);
  closeImage(bitmap);
  report(onProgress, 75);

  const mime = IMAGE_MIME[target];
  const quality = target === "png" ? undefined : 0.92;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) reject(new Error("Couldn't convert this image."));
        else resolve(result);
      },
      mime,
      quality,
    );
  });

  report(onProgress, 95);
  return blob;
}
