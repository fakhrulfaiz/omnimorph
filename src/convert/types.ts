export type InputKind =
  | "png"
  | "jpeg"
  | "webp"
  | "json"
  | "csv"
  | "xml"
  | "txt";

export type TargetFormat =
  | "png"
  | "jpeg"
  | "webp"
  | "csv"
  | "xml"
  | "json"
  | "json-pretty"
  | "json-minify"
  | "pdf";

export type ProgressFn = (percent: number) => void;

export interface ConversionResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}
