# Markdown Viewer

A tiny, zero-build web tool for editing and previewing Markdown in the browser, with live rendering, dark mode, Mermaid diagrams, and PDF export.

## Features

- **Live preview** — split-pane editor and rendered output update as you type.
- **Syntax highlighting** in the editor (overlay rendered on a transparent `<textarea>`).
- **Light / dark themes** with GitHub-style preview CSS (light, dark, dark dimmed). The choice is persisted to `localStorage`.
- **Mermaid diagrams** — fenced ` ```mermaid ` blocks are rendered as SVG and re-themed on theme change.
- **PDF export** of the rendered preview via `html2pdf.js` (always exported on a white background for print quality).
- **Copy to clipboard** — one click to copy the raw Markdown source.
- **Optional scroll sync** between editor and preview, toggled from the header.
- **Resizable split** — drag the divider to resize panes; double-click to reset to 50/50.
- **Autosave** — the last edited content is restored from `localStorage` on reload.
- **Sanitized output** — rendered HTML is passed through `DOMPurify`.

## Quick start

No build, no install, no server-side code. Either:

- Open `index.html` directly in a modern browser, or
- Serve the directory with any static file server, for example:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

A static server is recommended so that the bundled GitHub Markdown CSS files load via `fetch` for PDF export.


## Dependencies

Loaded from CDN at runtime (see `index.html`):

- [marked](https://github.com/markedjs/marked) — Markdown parser.
- [DOMPurify](https://github.com/cure53/DOMPurify) — HTML sanitization.
- [mermaid](https://github.com/mermaid-js/mermaid) — Diagram rendering.
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) — PDF export.
