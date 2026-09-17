# OmniMorph

Browser-only file converter (v1). Drop a file, pick a valid output, convert, and download. Nothing is uploaded.

## What v1 converts

| Input | Outputs |
| --- | --- |
| PNG, JPEG, WEBP | PNG, JPEG, WEBP (via HTML5 Canvas) |
| JSON | CSV, XML, pretty JSON, minified JSON |
| CSV, XML | JSON |
| TXT | PDF |

Unsupported types are rejected in the page. Image/PDF OCR is a stub only — Tesseract is not bundled.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

```bash
npm run build    # typecheck + production build
npm run preview  # serve the built app
npm test         # JSON↔CSV / pretty / router smoke tests
```

## Layout

- `src/convert/index.ts` — `convert(file, targetFormat)` router
- `src/convert/handlers/image.ts` — PNG ↔ JPEG ↔ WEBP
- `src/convert/handlers/data/json.ts` — JSON ↔ CSV, JSON ↔ XML, pretty / minify
- `src/convert/handlers/text/pdf.ts` — TXT → PDF (`pdf-lib`)
- `src/convert/handlers/ocr.ts` — placeholder for a later Tesseract path
- `src/detect.ts` — MIME + extension detection
- `src/main.ts` — UI

v1 is client-side only. No accounts, cloud, ffmpeg, or Docker.
