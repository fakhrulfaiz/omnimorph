/**
 * OCR hook stub for a later Image/PDF → TXT path (Tesseract).
 * Not wired into the v1 convert() router and must not pull Tesseract.js.
 */
export interface OcrOptions {
  lang?: string;
}

export async function ocrToText(
  _file: File,
  _options?: OcrOptions,
): Promise<string> {
  throw new Error("OCR is not available in OmniMorph v1.");
}
