import type { InputKind } from "./convert/types";

const MIME_MAP: Record<string, InputKind> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/webp": "webp",
  "application/json": "json",
  "text/json": "json",
  "text/csv": "csv",
  "application/csv": "csv",
  "application/xml": "xml",
  "text/xml": "xml",
  "text/plain": "txt",
};

const EXT_MAP: Record<string, InputKind> = {
  png: "png",
  jpg: "jpeg",
  jpeg: "jpeg",
  webp: "webp",
  json: "json",
  csv: "csv",
  xml: "xml",
  txt: "txt",
};

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function detectInput(file: File): InputKind | "unsupported" {
  const mime = file.type.toLowerCase();
  const ext = extensionOf(file.name);
  const fromExt = EXT_MAP[ext];
  const fromMime = MIME_MAP[mime];

  if (fromMime && fromExt && fromMime !== fromExt) {
    return fromExt;
  }
  if (fromExt) return fromExt;
  if (fromMime) return fromMime;
  return "unsupported";
}

export function kindLabel(kind: InputKind | "unsupported"): string {
  if (kind === "unsupported") return "Unknown";
  return kind.toUpperCase();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
