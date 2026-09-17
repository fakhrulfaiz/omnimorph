import type { ProgressFn } from "./types";

export function report(onProgress: ProgressFn | undefined, percent: number): void {
  onProgress?.(Math.max(0, Math.min(100, Math.round(percent))));
}

export async function readText(file: File): Promise<string> {
  return file.text();
}
