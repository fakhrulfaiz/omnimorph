import { describe, expect, it } from "vitest";
import { detectInput } from "../detect";
import {
  convert,
  FILE_TOO_LARGE_MESSAGE,
  MAX_FILE_BYTES,
  ocrToText,
  targetsFor,
} from "./index";
import { convertTextToPdf } from "./handlers/text/pdf";

function file(name: string, body: string, type: string): File {
  return new File([body], name, { type });
}

describe("detectInput", () => {
  it("uses extension when MIME is missing", () => {
    expect(detectInput(file("notes.txt", "hi", ""))).toBe("txt");
    expect(detectInput(file("data.JSON", "{}", ""))).toBe("json");
  });

  it("rejects types v1 does not convert", () => {
    expect(detectInput(file("clip.gif", "x", "image/gif"))).toBe("unsupported");
    expect(detectInput(file("movie.mp4", "x", "video/mp4"))).toBe("unsupported");
  });
});

describe("targetsFor", () => {
  it("exposes only valid outputs for each input", () => {
    expect(targetsFor("png")).toEqual(["jpeg", "webp"]);
    expect(targetsFor("json")).toEqual([
      "csv",
      "xml",
      "json-pretty",
      "json-minify",
    ]);
    expect(targetsFor("txt")).toEqual(["pdf"]);
  });
});

describe("convert router", () => {
  it("pretty-prints JSON", async () => {
    const result = await convert(file("n.json", '{"a":1}', "application/json"), "json-pretty");
    expect(result.filename).toBe("n.json");
    expect(await result.blob.text()).toBe("{\n  \"a\": 1\n}\n");
  });

  it("converts JSON to CSV", async () => {
    const result = await convert(
      file("rows.json", '[{"id":1,"name":"Ada"}]', "application/json"),
      "csv",
    );
    expect(result.filename).toBe("rows.csv");
    expect(await result.blob.text()).toBe("id,name\n1,Ada\n");
  });

  it("converts CSV to JSON", async () => {
    const result = await convert(
      file("rows.csv", "id,name\n1,Ada\n", "text/csv"),
      "json",
    );
    expect(JSON.parse(await result.blob.text())).toEqual([{ id: "1", name: "Ada" }]);
  });

  it("rejects an invalid target for the input", async () => {
    await expect(
      convert(file("n.json", "{}", "application/json"), "pdf"),
    ).rejects.toThrow(/not available/);
  });

  it("surfaces invalid JSON, XML, and CSV parse errors", async () => {
    await expect(
      convert(file("n.json", "{", "application/json"), "json-pretty"),
    ).rejects.toThrow("This JSON file is not valid.");
    await expect(
      convert(file("n.xml", "<nope", "application/xml"), "json"),
    ).rejects.toThrow("This XML file is not valid.");
    await expect(
      convert(file("n.csv", '"unclosed', "text/csv"), "json"),
    ).rejects.toThrow("This CSV file is not valid.");
  });

  it("rejects files over the size cap", async () => {
    const huge = file("n.json", "{}", "application/json");
    Object.defineProperty(huge, "size", { value: MAX_FILE_BYTES + 1 });
    await expect(convert(huge, "json-pretty")).rejects.toThrow(FILE_TOO_LARGE_MESSAGE);
  });

  it("reports determinate progress", async () => {
    const ticks: number[] = [];
    await convert(file("n.json", '{"a":1}', "application/json"), "json-minify", (n) => {
      ticks.push(n);
    });
    expect(ticks[0]).toBeGreaterThanOrEqual(0);
    expect(ticks.at(-1)).toBe(100);
    expect(ticks).toEqual([...ticks].sort((a, b) => a - b));
  });
});

describe("TXT → PDF", () => {
  it("builds a PDF from plain text", async () => {
    const blob = await convertTextToPdf(file("note.txt", "Hello OmniMorph", "text/plain"));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe("%PDF-");
  });
});

describe("OCR stub", () => {
  it("exists but is not implemented", async () => {
    await expect(ocrToText(file("x.png", "x", "image/png"))).rejects.toThrow(
      /not available/i,
    );
  });
});
