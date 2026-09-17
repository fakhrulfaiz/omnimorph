import { PDFDocument, StandardFonts } from "pdf-lib";
import type { ProgressFn } from "../../types";
import { readText, report } from "../../progress";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const FONT_SIZE = 11;
const LINE_HEIGHT = 16;

function toPdfText(text: string): string {
  return text.replace(/[^\u0009\u0020-\u007e\u00a0-\u00ff]/g, "?");
}

function wrapLine(
  text: string,
  font: { widthOfTextAtSize: (t: string, size: number) => number },
  maxWidth: number,
): string[] {
  const safe = toPdfText(text);
  if (safe === "") return [""];
  const words = safe.split(/(\s+)/);
  const lines: string[] = [];
  let current = "";

  const fits = (value: string) => font.widthOfTextAtSize(value, FONT_SIZE) <= maxWidth;

  const takeOverflow = (chunk: string) => {
    if (fits(current ? current + chunk : chunk)) {
      current = current ? current + chunk : chunk;
      return;
    }
    if (current) {
      lines.push(current);
      current = "";
    }
    let rest = chunk;
    while (rest && !fits(rest)) {
      let lo = 1;
      let hi = rest.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (fits(rest.slice(0, mid))) lo = mid;
        else hi = mid - 1;
      }
      lines.push(rest.slice(0, Math.max(lo, 1)));
      rest = rest.slice(Math.max(lo, 1));
    }
    current = rest;
  };

  for (const word of words) {
    takeOverflow(word);
  }
  if (current || lines.length === 0) lines.push(current);
  return lines;
}

export async function convertTextToPdf(
  file: File,
  onProgress?: ProgressFn,
): Promise<Blob> {
  report(onProgress, 10);
  const text = await readText(file);
  report(onProgress, 30);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Courier);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  const lines = text.split(/\r?\n/).flatMap((line) => wrapLine(line, font, maxWidth));
  report(onProgress, 55);

  const linesPerPage = Math.floor((PAGE_HEIGHT - MARGIN * 2) / LINE_HEIGHT);
  const pages = lines.length === 0 ? [""] : lines;

  for (let i = 0; i < pages.length; i += linesPerPage) {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const slice = pages.slice(i, i + linesPerPage);
    slice.forEach((line, index) => {
      page.drawText(line.replace(/\t/g, "  "), {
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN - index * LINE_HEIGHT,
        size: FONT_SIZE,
        font,
      });
    });
  }

  report(onProgress, 85);
  const bytes = await pdf.save();
  report(onProgress, 95);
  const payload = new Uint8Array(bytes.byteLength);
  payload.set(bytes);
  return new Blob([payload], { type: "application/pdf" });
}
