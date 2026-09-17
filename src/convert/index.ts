import { detectInput } from "../detect";
import { convertData } from "./handlers/data";
import { convertImage } from "./handlers/image";
import { convertTextToPdf } from "./handlers/text/pdf";
import { mimeFor, outputFilename, targetsFor } from "./targets";
import type { ConversionResult, ProgressFn, TargetFormat } from "./types";
import { report } from "./progress";

export type { ConversionResult, InputKind, ProgressFn, TargetFormat } from "./types";
export { targetsFor, TARGET_LABELS, UNSUPPORTED_COPY } from "./targets";
export { ocrToText } from "./handlers/ocr";
export type { OcrOptions } from "./handlers/ocr";

const IMAGE_TARGETS = new Set<TargetFormat>(["png", "jpeg", "webp"]);
const DATA_TARGETS = new Set<TargetFormat>([
  "csv",
  "xml",
  "json",
  "json-pretty",
  "json-minify",
]);

export async function convert(
  file: File,
  targetFormat: TargetFormat,
  onProgress?: ProgressFn,
): Promise<ConversionResult> {
  report(onProgress, 4);
  const kind = detectInput(file);
  if (kind === "unsupported") {
    throw new Error("Can't convert this type yet.");
  }
  if (!targetsFor(kind).includes(targetFormat)) {
    throw new Error("That output is not available for this file.");
  }

  let blob: Blob;
  if (kind === "png" || kind === "jpeg" || kind === "webp") {
    if (!IMAGE_TARGETS.has(targetFormat)) {
      throw new Error("That output is not available for this file.");
    }
    blob = await convertImage(
      file,
      targetFormat as "png" | "jpeg" | "webp",
      onProgress,
    );
  } else if (kind === "txt") {
    if (targetFormat !== "pdf") {
      throw new Error("That output is not available for this file.");
    }
    blob = await convertTextToPdf(file, onProgress);
  } else {
    if (!DATA_TARGETS.has(targetFormat)) {
      throw new Error("That output is not available for this file.");
    }
    blob = await convertData(
      file,
      kind,
      targetFormat as "csv" | "xml" | "json" | "json-pretty" | "json-minify",
      onProgress,
    );
  }

  report(onProgress, 100);
  return {
    blob,
    filename: outputFilename(file.name, targetFormat),
    mimeType: mimeFor(targetFormat),
  };
}
