import type { InputKind, TargetFormat } from "./types";

export const UNSUPPORTED_COPY =
  "Can't convert this type yet. v1 converts PNG, JPEG, WEBP, JSON, CSV, XML, and TXT.";

export const TARGET_LABELS: Record<TargetFormat, string> = {
  png: "PNG",
  jpeg: "JPEG",
  webp: "WEBP",
  csv: "CSV",
  xml: "XML",
  json: "JSON",
  "json-pretty": "JSON (pretty)",
  "json-minify": "JSON (minified)",
  pdf: "PDF",
};

const TARGETS: Record<InputKind, TargetFormat[]> = {
  png: ["jpeg", "webp"],
  jpeg: ["png", "webp"],
  webp: ["png", "jpeg"],
  json: ["csv", "xml", "json-pretty", "json-minify"],
  csv: ["json"],
  xml: ["json"],
  txt: ["pdf"],
};

export function targetsFor(kind: InputKind): TargetFormat[] {
  return TARGETS[kind];
}

export function extensionFor(target: TargetFormat): string {
  switch (target) {
    case "jpeg":
      return "jpg";
    case "json-pretty":
    case "json-minify":
      return "json";
    default:
      return target;
  }
}

export function mimeFor(target: TargetFormat): string {
  switch (target) {
    case "png":
      return "image/png";
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "csv":
      return "text/csv";
    case "xml":
      return "application/xml";
    case "json":
    case "json-pretty":
    case "json-minify":
      return "application/json";
    case "pdf":
      return "application/pdf";
  }
}

export function outputFilename(originalName: string, target: TargetFormat): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "converted";
  return `${base}.${extensionFor(target)}`;
}
