import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  FILE_TOO_LARGE_MESSAGE,
  GENERIC_CONVERT_ERROR,
  MAX_FILE_BYTES,
} from "./convert";

beforeAll(async () => {
  const html = readFileSync(join(process.cwd(), "index.html"), "utf8");
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";
  document.body.innerHTML = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  await import("./main");
});

function file(name: string, body: string, type: string): File {
  return new File([body], name, { type });
}

async function chooseFile(chosen: File): Promise<void> {
  const input = document.getElementById("file-input") as HTMLInputElement;
  const transfer = new DataTransfer();
  transfer.items.add(chosen);
  input.files = transfer.files;
  input.dispatchEvent(new Event("change"));
  await Promise.resolve();
}

describe("convert failure UI", () => {
  it("shows the real parse error instead of a generic message", async () => {
    await chooseFile(file("broken.json", "{", "application/json"));
    const select = document.getElementById("format") as HTMLSelectElement;
    select.value = "json-pretty";
    select.dispatchEvent(new Event("change"));
    document.getElementById("convert")!.click();
    await vi.waitFor(() => {
      expect(document.getElementById("fail")?.hidden).toBe(false);
    });
    expect(document.getElementById("fail-message")?.textContent).toBe(
      "This JSON file is not valid.",
    );
    expect(document.getElementById("fail-message")?.textContent).not.toBe(
      GENERIC_CONVERT_ERROR,
    );
  });

  it("rejects oversized files before convert", async () => {
    const huge = file("big.json", "{}", "application/json");
    Object.defineProperty(huge, "size", { value: MAX_FILE_BYTES + 1 });
    await chooseFile(huge);
    expect(document.getElementById("reject")?.hidden).toBe(false);
    expect(document.getElementById("reject")?.textContent).toBe(FILE_TOO_LARGE_MESSAGE);
    expect((document.getElementById("convert") as HTMLButtonElement).disabled).toBe(true);
  });
});
