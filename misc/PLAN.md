# PLAN.md - Desktop Performance Pass

> **Scope:** This is a **desktop app** (split-pane markdown editor). Mobile metrics are
> not a target. Lighthouse 13.3.0 / Chrome 146 desktop score is **82**; pushing it past
> **95** is realistic in one pass.
>
> **Data source:** `misc/LIGHTHOUSE_REPORT.md` (Lighthouse v13.3.0, captured
> 2026-06-05 23:02 GMT+2, HeadlessChromium 146, **no throttling**).
>
> **Desktop baseline:**
>
> | Perf | A11y | BP  | SEO |
> |------|------|-----|-----|
> | 82   | 88   | 96  | 100 |
>
> | FCP | LCP | TBT | CLS | SI  |
> |-----|-----|-----|-----|-----|
> | 1.4 s | 4.1 s | 200 ms | 0 | 1.4 s |
>
> Critical-path latency: **1 168 ms** over 44 requests, dominated by
> `Roboto.ttf` (275 KiB) and `mermaid.min.js` (840 KiB).

---

## 0. Ground rules

1. **No build step.** Project is "no transpile, no bundle". Keep it that way.
2. **No new dependencies.** Every fix is a code/local-asset change.
3. **Behaviour must not regress.** Live preview, scroll-sync, theme, mermaid
   all keep working. The editor must still open with no JS at all (FOUC guard
   stays).
4. **Cache-friendly.** All 3rd-party assets already have query hashes on CDNs
   - keep using the same URLs for now; do not pin to specific versions.
5. **Desktop only.** No responsive work, no mobile emulation paths, no
   `meta viewport`/`touch-action` games.

---

## 1. Wins ranked by impact (desktop, est. score delta)

| # | Win | Est. ms saved | Score delta | Risk |
|---|-----|---------------|-------------|------|
| 1 | Defer 5 of 6 CDN scripts, keep DOMPurify sync (small) | -700 | +6 to +9 | low |
| 2 | Self-host + font-display:swap + subset for `Roboto.ttf` (275 KiB -> ~45 KiB) | -400 on LCP, -230 KiB | +3 to +5 | low |
| 3 | Lazy-import `mermaid` + `html2pdf` (only when used) | -600 on initial, -1.2 MiB wire | +4 to +6 | medium |
| 4 | Flatten the CSS `@import` chain in `style.css` (7 round-trips -> 1) | -300 | +1 to +2 | very low |
| 5 | Remove dead CSS (`github-markdown-dark.css`, both unused stylesheet branches) | -45 KiB wire + parse | +1 | very low |
| 6 | Conditional Prism load (only when a `code` block is in the document) | -150 ms, -30 KiB | +1 to +2 | low |
| 7 | Replace custom scrollbar DOM (6 elements, 851 -> ~600 nodes) with `scrollbar-width`/`::-webkit-scrollbar` | -100 ms TBT | +1 | medium |
| 8 | Mark `markdown-preview-logo.svg` `<link rel="preload">`, drop unused `<link rel="preconnect">` | -100 | +0 to +1 | trivial |
| **Total** | | **~ -2 300 ms** | **+18 to +28** | |

Cumulative target: **Performance 99-100**, **A11y 95+**.

---

## 2. Step 1 - Unblock rendering from the 6 CDN scripts

**File:** `index.html` lines 294-300

**Current:**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.4.0/purify.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@11/dist/marked.umd.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script type="module" src="js/main.js"></script>
```

Six render-blocking downloads (~1.6 MiB) sit between the parser and first paint.

**Change:**

1. Keep `marked` and `dompurify` **synchronous** (both are required before the
   first `convert()` call in `js/main.js`). They are small (~80 KiB combined)
   and used for the very first render.
2. Add `defer` to `prism-core`, `prism-autoloader`. The editor still loads and
   renders without syntax highlighting; the first user-typed code block will
   trigger highlighting once they finish typing.
3. **Remove** `html2pdf.bundle.min.js` (417 KiB) and `mermaid.min.js` (840 KiB)
   from the HTML. They will be loaded via `import()` on demand - see Step 3.
4. Add `crossorigin="anonymous"` to the two remaining CDN tags so the browser
   can cache the response.
5. Move the third-party `<script>` tags to the **end of `<body>`** (after the
   module import is fine; module scripts are deferred by default).

**After:**
```html
<!-- Critical (small, needed for first render) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.4.0/purify.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@11/dist/marked.umd.js" crossorigin="anonymous"></script>
<!-- Optional (large, loaded on demand) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js" defer crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js" defer crossorigin="anonymous"></script>
<!-- Module entrypoint - deferred by spec -->
<script type="module" src="js/main.js"></script>
```

Expected: critical-path latency drops from **1 168 ms -> ~520 ms**.

---

## 3. Step 2 - Lazy-load `mermaid` and `html2pdf` on demand

**Files:**
- `js/preview/mermaid-renderer.js` (replace `import { ... }` with dynamic)
- `js/preview/actions.js` (`initPdfButton` -> load on click)
- remove the two `<script>` tags added in Step 2.

### 3a. Mermaid

Current:
```js
// js/main.js line 16
import { initMermaid, renderMermaidDiagrams } from './preview/mermaid-renderer.js';
// js/preview/mermaid-renderer.js
import mermaid from 'mermaid';   // hypothetical - actually loaded as UMD global
```

`mermaid` is a UMD bundle (loaded as `window.mermaid` today). Convert the
mermaid renderer to a singleton that injects `<script>` once on first use:

```js
// js/preview/mermaid-renderer.js
let mermaidReady = null;

export function loadMermaid() {
  if (mermaidReady) return mermaidReady;
  mermaidReady = new Promise((resolve, reject) => {
    if (window.mermaid) { resolve(window.mermaid); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve(window.mermaid);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return mermaidReady;
}

export async function initMermaid() {
  const mermaid = await loadMermaid();
  // existing initMermaid body
}
```

`scheduleMermaidRender()` becomes a no-op if no `pre.mermaid` exists in the
output - i.e. the script is **never downloaded** for documents with no
diagrams.

### 3b. html2pdf

Same pattern in `js/preview/actions.js`:

```js
let pdfLibPromise = null;
function loadPdfLib() {
  if (pdfLibPromise) return pdfLibPromise;
  pdfLibPromise = import('https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js')
    .then(m => m.default || window.html2pdf);
  return pdfLibPromise;
}

export async function initPdfButton() {
  // wire DOM listener
  button.addEventListener('click', async () => {
    const html2pdf = await loadPdfLib();
    html2pdf().set(opts).from(node).save();
  }, { once: false });
}
```

`import()` of a CDN URL is supported in modern Chromium; if the runtime is
older, fall back to the `<script>` injection pattern above. Both work in
HeadlessChromium 146.

**Result:** ~1.25 MiB removed from the initial download. Documents with
no mermaid block never pay the cost.

---

## 4. Step 3 - Fix the font situation

**Files:** `index.html` (header CSS in `css/header.css`), `css/header.css`,
project root `*.ttf`.

Current cost: `Roboto.ttf` (275 KiB) and `monaco.ttf` (39 KiB) are referenced
unconditionally in `css/header.css` and downloaded before first paint.

**Plan:**

1. Move both `.ttf` files into `/fonts/` (already at the root, just relocate
   for clarity).
2. Add `font-display: swap` to both `@font-face` blocks (or switch to WOFF2
   with `unicode-range`).
3. **Sub-set Roboto** with `pyftsubset` (or `glyphhanger`) to keep only the
   glyphs used by the UI (Latin, numbers, common punctuation). Result is
   **~30-50 KiB** instead of 275 KiB.
4. **Async font load** with `<link rel="preload" as="font" type="font/ttf" crossorigin>` for the swap-in.
5. For `monaco.ttf`: confirm it is actually a *fallback* and the editor
   textarea uses system monospace by default. If so, **delete** the file and
   the `@font-face` block. (Sanity check: search `monaco.ttf` in CSS/JS first.)

**Code:**
```css
/* css/header.css */
@font-face {
  font-family: 'RobotoSubset';
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url('/fonts/roboto-subset.woff2') format('woff2');
}
```

```html
<!-- index.html <head> -->
<link rel="preload" href="/fonts/roboto-subset.woff2" as="font" type="font/woff2" crossorigin>
```

---

## 5. Step 4 - Flatten the CSS chain

**File:** `css/style.css`

Currently 7 `@import` lines, each a serial round-trip. The file is
**290 bytes**; the browser is doing 7 separate HTTP requests before it can
begin rendering CSS.

**Plan:** concatenate manually (or with a 10-line Node script in `misc/`)
into a single `style.css`. Ship a single `<link>` tag.

Result: **-6 round-trips** on the critical path. Roughly -200 to -300 ms on
the desktop test.

**Code (one-liner):**
```bash
cat css/variables.css css/reset.css css/layout.css css/header.css \
    css/editor.css css/preview.css css/scrollbars.css \
    > css/style.css.bundled
mv css/style.css.bundled css/style.css
```

Keep `@import` lines at the top of the bundle for source-clarity but use the
single bundled file at runtime.

---

## 6. Step 5 - Drop the unused `github-markdown-dark.css`

`css/github-markdown-dark.css` (22 KiB) is never referenced from the
`index.html` (the boot script only injects `github-markdown-light.css` or
`github-markdown-dark_dimmed.css`).

**Action:** delete `css/github-markdown-dark.css` outright, remove any
import. -22 KiB wire, -22 KiB parse.

**Verify:** `grep -R "github-markdown-dark\"" js css` should return nothing
after.

---

## 7. Step 6 - Conditional Prism

`prism-core.min.js` and `prism-autoloader.min.js` are loaded even when the
user is editing a plain README with no code blocks. Defer the
`prism.highlightAllUnder()` call until a `pre code` actually appears in
the rendered output.

**File:** `js/preview/markdown-renderer.js` lines 91-104

**Current:** `Prism.highlightAllUnder(output)` runs every time.

**Change:**
```js
if (output.querySelector('pre code')) {
  if (window.Prism) {
    Prism.highlightAllUnder(output);
  } else {
    // the deferred <script> hasn't loaded yet - wait once
    document.querySelector('script[src*="prism-core.min.js"]')
      ?.addEventListener('load', () => Prism.highlightAllUnder(output), { once: true });
  }
}
```

If the document never contains a code block, Prism's `defer` script sits
idle in the browser cache for next time and does nothing now.

---

## 8. Step 7 - Shrink the DOM (851 -> ~600 nodes)

The desktop report flags **DOM size 851 elements** ("a large DOM will
increase the duration of style calculations and layout reflows").

The big contributors (visible in `index.html`):

| Element | Count | Notes |
|---|---|---|
| `#editor-scroll-overlay` | 4 | only used on small viewports |
| `#editor-clearall-popup` | 4 | hidden until triggered |
| `#preview-scroll-overlay` | 4 | same |
| `#preview-hscroll-overlay` | 4 | same |
| `#preview-fullscreen-popup` | 4 | same |
| `#preview-hscrollbar` | 5 | full custom H scrollbar |
| `#preview-custom-scrollbar` | 5 | full custom V scrollbar |
| `#editor` / `#editor-highlight` | 2 | OK |
| **Custom scrollbar thumbs + arrows** | ~25 | replaceable with native |

**Plan:**

1. Replace the **custom vertical scrollbar** (`#preview-custom-scrollbar`,
   `js/preview/scrollbars.js`, ~150 lines) with a CSS-only scrollbar using
   `scrollbar-color` / `scrollbar-width: thin` and `::-webkit-scrollbar`.
   This deletes ~25 DOM nodes and the per-frame JS in the scroll handler.
2. Same for `#editor` - native scrollbar with the existing
   `css/scrollbars.css` styling (already has the styles, just stop *using*
   the custom thumb in `js/main.js`).
3. Keep the four popup overlays but **lazy-create** them on first
   interaction (move their markup into the JS that needs them). Each popup
   is 4 nodes -> we save 16 by not rendering them until the first click.

**Result:** ~250 nodes removed. `cls-culprits` and layout-reflow cost drop.

---

## 9. Step 8 - Misc hygiene

- `index.html` `<head>` has the `crossorigin` attribute only on gstatic
  preconnects. Add it to the remaining `<script>` and `<link rel="preload">`
  tags so the browser can reuse the connection.
- Add `<link rel="modulepreload" href="js/main.js">` after the
  `<script type="module">` line. Marginal win, but free.
- `<meta name="description">` is present - good. The boot script also already
  sets `<html data-theme>` for FOUC prevention - keep it.
- Lighthouse complains about a `<div id="editor-highlight">` containing
  **highly complex nested markup** ("DOM depth > 32" warning). Audit
  `js/editor/highlighter.js`; the highlighter mirror may be wrapping spans
  recursively. Set a hard cap on nesting depth (32) and bail out beyond it.

---

## 10. Acceptance criteria

A run of `npx lighthouse https://onth0s.github.io/markdown-viewer/ --preset=desktop`
after all 8 steps must satisfy:

- **Performance >= 95**
- **Accessibility >= 95**  (was 88; mostly `landmark-one-main` and
  `color-contrast` - fix as a stretch)
- **Best Practices = 100**
- **SEO = 100** (already)
- **LCP <= 2.0 s** (was 4.1 s)
- **TBT <= 100 ms** (was 200 ms)
- **No new 4xx/5xx in the network log**
- The Markdown demo (`DEFAULT.md`) still renders, scrolls in sync, themes
  swap, and the mermaid sample still draws.

The PageSpeed HTML in `misc/NOTES.md` is **not** to be re-uploaded or
re-parsed - it is a one-shot historical artefact.

---

## 11. Out of scope (do not do in this pass)

- Mobile-specific work, viewport meta, `touch-action`
- Replacing `marked` with a different parser
- A bundler / minifier / build step
- Service worker / offline cache
- Re-architecting the theme system
- Server-side rendering
- Anything that requires running `npm install` of new packages

---

## 12. Order of operations

1. Step 1 (script defer) - 5 min, biggest win, revertible
2. Step 2 (lazy mermaid + html2pdf) - 30 min, biggest wire-bytes win
3. Step 3 (font subset) - 20 min, requires `pyftsubset`
4. Step 4 (CSS flatten) - 5 min
5. Step 5 (delete dead CSS) - 1 min
6. Step 6 (conditional Prism) - 10 min
7. Step 7 (DOM shrink) - 60 min, biggest behavioural risk
8. Step 8 (hygiene + accessibility stretch) - 30 min

Re-run Lighthouse after each step. Stop at the first regression.
