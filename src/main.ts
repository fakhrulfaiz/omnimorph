import { convert, TARGET_LABELS, targetsFor, UNSUPPORTED_COPY } from "./convert";
import type { TargetFormat } from "./convert/types";
import { detectInput, formatBytes, kindLabel } from "./detect";

type Phase = "idle" | "ready" | "converting" | "done" | "failed";

const dropzone = el<HTMLButtonElement>("dropzone");
const fileInput = el<HTMLInputElement>("file-input");
const chip = el<HTMLDivElement>("chip");
const chipName = el<HTMLDivElement>("chip-name");
const chipInfo = el<HTMLDivElement>("chip-info");
const replaceBtn = el<HTMLButtonElement>("replace");
const reject = el<HTMLParagraphElement>("reject");
const formatSelect = el<HTMLSelectElement>("format");
const convertBtn = el<HTMLButtonElement>("convert");
const progressWrap = el<HTMLDivElement>("progress-wrap");
const progressBar = el<HTMLProgressElement>("progress");
const progressLabel = el<HTMLSpanElement>("progress-label");
const fail = el<HTMLParagraphElement>("fail");
const retryBtn = el<HTMLButtonElement>("retry");
const done = el<HTMLDivElement>("done");
const downloadBtn = el<HTMLButtonElement>("download");
const anotherBtn = el<HTMLButtonElement>("another");

let currentFile: File | null = null;
let phase: Phase = "idle";
let resultUrl: string | null = null;
let resultName = "";

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

function setHidden(node: HTMLElement, hidden: boolean): void {
  node.hidden = hidden;
}

function resetResult(): void {
  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }
  resultName = "";
}

function setProgress(percent: number): void {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  progressBar.value = value;
  progressLabel.textContent = `${value}%`;
}

function fillTargets(kind: ReturnType<typeof detectInput>): void {
  formatSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose format";
  formatSelect.append(placeholder);

  if (kind === "unsupported") {
    formatSelect.disabled = true;
    return;
  }

  for (const target of targetsFor(kind)) {
    const option = document.createElement("option");
    option.value = target;
    option.textContent = TARGET_LABELS[target];
    formatSelect.append(option);
  }
  formatSelect.disabled = false;
}

function render(): void {
  const hasFile = Boolean(currentFile);
  setHidden(dropzone, hasFile);
  setHidden(chip, !hasFile);

  const kind = currentFile ? detectInput(currentFile) : "unsupported";
  const unsupported = hasFile && kind === "unsupported";
  reject.textContent = UNSUPPORTED_COPY;
  setHidden(reject, !unsupported);

  if (currentFile) {
    chipName.textContent = currentFile.name;
    chipInfo.textContent = `${kindLabel(kind)} · ${formatBytes(currentFile.size)}`;
  }

  const converting = phase === "converting";
  const canChoose = hasFile && !unsupported && !converting;
  formatSelect.disabled = !canChoose;
  convertBtn.disabled = !canChoose || formatSelect.value === "";
  setHidden(convertBtn, converting || phase === "done" || phase === "failed");
  setHidden(progressWrap, !converting);
  setHidden(fail, phase !== "failed");
  setHidden(done, phase !== "done");
  replaceBtn.disabled = converting;
}

function setFile(file: File | null): void {
  currentFile = file;
  resetResult();
  phase = file ? "ready" : "idle";
  fillTargets(file ? detectInput(file) : "unsupported");
  setProgress(0);
  render();
}

async function runConvert(): Promise<void> {
  if (!currentFile || formatSelect.value === "") return;
  const target = formatSelect.value as TargetFormat;
  phase = "converting";
  setProgress(0);
  render();

  try {
    const result = await convert(currentFile, target, setProgress);
    resetResult();
    resultUrl = URL.createObjectURL(result.blob);
    resultName = result.filename;
    phase = "done";
    setProgress(100);
    render();
  } catch {
    phase = "failed";
    render();
  }
}

function download(): void {
  if (!resultUrl || !resultName) return;
  const link = document.createElement("a");
  link.href = resultUrl;
  link.download = resultName;
  link.click();
}

dropzone.addEventListener("click", () => fileInput.click());
replaceBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0] ?? null;
  fileInput.value = "";
  if (file) setFile(file);
});

formatSelect.addEventListener("change", () => {
  if (phase === "done" || phase === "failed") {
    resetResult();
    phase = "ready";
  }
  render();
});

convertBtn.addEventListener("click", () => {
  void runConvert();
});
retryBtn.addEventListener("click", () => {
  void runConvert();
});
downloadBtn.addEventListener("click", download);
anotherBtn.addEventListener("click", () => setFile(null));

(["dragenter", "dragover"] as const).forEach((eventName) => {
  document.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-over");
  });
});

(["dragleave", "drop"] as const).forEach((eventName) => {
  document.addEventListener(eventName, (event) => {
    event.preventDefault();
    if (eventName === "dragleave") dropzone.classList.remove("is-over");
  });
});

document.addEventListener("drop", (event) => {
  dropzone.classList.remove("is-over");
  const file = event.dataTransfer?.files?.[0];
  if (file && phase !== "converting") setFile(file);
});

render();
