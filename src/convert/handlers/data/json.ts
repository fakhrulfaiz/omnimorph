import type { ProgressFn, TargetFormat } from "../../types";
import { readText, report } from "../../progress";

export function parseCsv(text: string): Record<string, string>[] {
  const rows = splitCsv(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim() || "column");
  const used = new Map<string, number>();
  const uniqueHeaders = headers.map((h) => {
    const count = used.get(h) ?? 0;
    used.set(h, count + 1);
    return count === 0 ? h : `${h}_${count + 1}`;
  });

  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => {
      const obj: Record<string, string> = {};
      uniqueHeaders.forEach((header, i) => {
        obj[header] = row[i] ?? "";
      });
      return obj;
    });
}

export function toCsv(value: unknown): string {
  const rows = normalizeRows(value);
  if (rows.length === 0) return "";
  const headers: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key);
    }
  }
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(stringifyCell(row[h]))).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

export function jsonToXml(value: unknown): string {
  const inner =
    Array.isArray(value)
      ? value.map((item) => toXml(item, "item")).join("")
      : value !== null && typeof value === "object"
        ? Object.entries(value as Record<string, unknown>)
            .map(([key, child]) => toXml(child, tagName(key)))
            .join("")
        : escapeXml(primitive(value));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<root>${inner}</root>\n`;
}

export function xmlToJson(xml: string): unknown {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const error = doc.querySelector("parsererror");
  if (error) throw new Error("This XML file is not valid.");
  const root = doc.documentElement;
  if (!root) throw new Error("This XML file is empty.");
  const children = [...root.children];
  if (children.length === 0) return coerce(root.textContent ?? "");
  if (children.every((child) => child.tagName === "item")) {
    return children.map(elementToValue);
  }
  return elementToValue(root);
}

export function prettyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function minifyJson(value: unknown): string {
  return JSON.stringify(value);
}

export async function convertData(
  file: File,
  source: "json" | "csv" | "xml",
  target: Extract<TargetFormat, "csv" | "xml" | "json" | "json-pretty" | "json-minify">,
  onProgress?: ProgressFn,
): Promise<Blob> {
  report(onProgress, 15);
  const text = await readText(file);
  report(onProgress, 40);

  let value: unknown;
  if (source === "json") {
    try {
      value = JSON.parse(text);
    } catch {
      throw new Error("This JSON file is not valid.");
    }
  } else if (source === "csv") {
    value = parseCsv(text);
  } else {
    value = xmlToJson(text);
  }
  report(onProgress, 70);

  let out: string;
  let mime: string;
  if (target === "csv") {
    out = toCsv(value);
    mime = "text/csv";
  } else if (target === "xml") {
    out = jsonToXml(value);
    mime = "application/xml";
  } else if (target === "json-minify") {
    out = minifyJson(value);
    mime = "application/json";
  } else {
    out = prettyJson(value);
    mime = "application/json";
  }

  report(onProgress, 95);
  return new Blob([out], { type: mime });
}

function splitCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\n") {
      pushRow();
    } else if (c === "\r") {
      if (input[i + 1] === "\n") i++;
      pushRow();
    } else {
      field += c;
    }
  }

  if (quoted) throw new Error("This CSV file is not valid.");
  if (field.length > 0 || row.length > 0) pushRow();
  return rows;
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalizeRows(value: unknown): Record<string, unknown>[] {
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => {
    if (item !== null && typeof item === "object" && !Array.isArray(item)) {
      return item as Record<string, unknown>;
    }
    return { value: item };
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tagName(key: string): string {
  let tag = key.replace(/[^A-Za-z0-9_.-]/g, "_");
  if (!/^[A-Za-z_]/.test(tag)) tag = `n_${tag}`;
  return tag || "item";
}

function primitive(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toXml(value: unknown, tag: string): string {
  if (value === null || value === undefined) return `<${tag}/>`;
  if (Array.isArray(value)) {
    if (value.length === 0) return `<${tag}/>`;
    return `<${tag}>${value.map((item) => toXml(item, "item")).join("")}</${tag}>`;
  }
  if (typeof value === "object") {
    const children = Object.entries(value as Record<string, unknown>)
      .map(([key, child]) => toXml(child, tagName(key)))
      .join("");
    return `<${tag}>${children}</${tag}>`;
  }
  return `<${tag}>${escapeXml(primitive(value))}</${tag}>`;
}

function coerce(text: string): string | number | boolean | null {
  const trimmed = text.trim();
  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return text;
}

function elementToValue(el: Element): unknown {
  const children = [...el.children];
  if (children.length === 0) return coerce(el.textContent ?? "");
  const obj: Record<string, unknown> = {};
  for (const child of children) {
    const key = child.tagName;
    const val = elementToValue(child);
    if (key in obj) {
      const prev = obj[key];
      obj[key] = Array.isArray(prev) ? [...prev, val] : [prev, val];
    } else {
      obj[key] = val;
    }
  }
  return obj;
}
