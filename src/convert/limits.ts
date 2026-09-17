export const MAX_FILE_BYTES = 32 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 8192;
export const MAX_IMAGE_PIXELS = 16_777_216;

export const GENERIC_CONVERT_ERROR = "Couldn't convert this file.";
export const FILE_TOO_LARGE_MESSAGE = "This file is too large.";
export const IMAGE_TOO_LARGE_MESSAGE = "This image is too large.";

export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return GENERIC_CONVERT_ERROR;
}

export function assertFileSize(file: File): void {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(FILE_TOO_LARGE_MESSAGE);
  }
}

export function assertImageDimensions(width: number, height: number): void {
  if (
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new Error(IMAGE_TOO_LARGE_MESSAGE);
  }
}
