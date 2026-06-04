# Refactoring Strategy — `markdown-viewer`

> Scope: full audit of the repository at the time of writing, plus a phased
> refactoring plan. Each phase is independent of the next (you can stop after
> any phase) and behaviour-preserving unless explicitly noted. The codebase is
> already tight; the phases below are micro-polish, not structural rewrites.

---

## 1. Audit summary

### 1.1 Layout

```
.
├── index.html              # single entry point, no build step
├── js/script.js            # 554 LOC, all top-level, no module wrapper
├── css/
│   ├── style.css           # 458 LOC, app chrome + syntax-highlight palette
│   ├── github-markdown-light.css        # 3rd-party, used at runtime
│   ├── github-markdown-dark.css         # 3rd-party, UNUSED
│   └── github-markdown-dark_dimmed.css  # 3rd-party, used at runtime
├── svg/                    # 3 icons, all UNUSED
├── image/
│   ├── Markdown-mark.svg   # referenced by the default content
│   └── sample.webp         # UNUSED
├── Roboto.ttf              # UNUSED
├── monaco.ttf              # used by style.css @font-face
├── logo.png                # used (header + favicon)
├── README.md
└── .gitignore              # 2 lines
```

### 1.2 Findings, ordered by impact

| # | File | Finding |
|---|------|---------|
| 1 | `svg/`, `image/sample.webp`, `Roboto.ttf`, `css/github-markdown-dark.css` | Dead assets shipped in the repo; the icons are inlined in `index.html` and the dark (non-dimmed) theme is not the active one. |
| 2 | `index.html` (inline boot) + `js/script.js` (lines 85–90) | Theme key, scroll key, and the two preview-CSS paths are duplicated in two places that must stay in sync. |
| 3 | `js/script.js:1,287,292` | `let hasEdited` is written twice and read zero times. |
| 4 | `js/script.js:298,302` | Two separate `editor.addEventListener('scroll', ...)` handlers. |
| 5 | `js/script.js` (whole file) | No `'use strict'`, no IIFE, no module — all `let`/`const` leak to `window`. |
| 6 | `js/script.js:265` | `marked.parse(markdown, { headerIds: false, mangle: false, renderer })` — `headerIds` and `mangle` have been removed/no-op in `marked` ≥ 4; the active `marked.umd.js` is loaded from `cdn.jsdelivr.net/npm/marked` (latest). Drop or annotate. |
| 7 | `css/style.css:13,24` | Two `body { ... }` rule blocks. |
| 8 | `css/style.css:300–326` | ~18 dark-mode selectors repeat the syntax-highlight palette. A small set of CSS custom properties would centralise the palette. |
| 9 | `.gitignore` | Only 2 entries (`.DS_Store`, `.firebaserc`); missing common OS/editor noise. |
| 10 | `README.md` | Recent rewrite is good; no "Project layout" or "How to extend" sections. |

Nothing in the audit is a bug. All items are cosmetic / hygiene.

---

## 2. Refactoring phases (sequential)

Each phase is small enough to land as a single commit. Phases are independent
**except** that Phase 1 introduces a shared config artifact which the rest of
the file (and the inline boot) can then read; subsequent phases can still be
done in either order after that.

### Phase 0 — Repo hygiene (no behaviour change)

**Goal:** remove dead assets, expand `.gitignore`. Smallest possible diff.

1. Delete unused files:
   - `Roboto.ttf`
   - `image/sample.webp`
   - `svg/scroll-up-down.svg`, `svg/light-dark.svg`, `svg/download.svg`
   - `css/github-markdown-dark.css`  (the non-dimmed dark theme)
2. Verify no references survive the deletions (grep for each filename). The
   inline SVGs in `index.html` and the active theme key
   `css/github-markdown-dark_dimmed.css` are kept.
3. Expand `.gitignore` to cover common noise:
   ```
   .DS_Store
   .firebaserc
   Thumbs.db
   .vscode/
   .idea/
   *.log
   *.swp
   ```

**Acceptance:** `git grep` for each removed file returns nothing. App boots
and renders unchanged.

---

### Phase 1 — Single source of truth for shared constants

**Goal:** deduplicate the four constants (theme key, scroll key, light-CSS
path, dark-CSS path) that today live in both `index.html` (inline boot) and
`js/script.js`.

**Approach (no build step, no extra request):**

1. In `index.html`, add a single config block right before the inline boot
   script:
   ```html
   <script id="mdv-config" type="application/json">
   {
     "themeKey":  "com.markdownlivepreview_theme",
     "scrollKey": "mdv_scroll_sync",
     "lightCss":  "css/github-markdown-light.css",
     "darkCss":   "css/github-markdown-dark_dimmed.css"
   }
   </script>
   ```
2. Replace the four `var ... = '...'` declarations inside the inline boot
   with `var cfg = JSON.parse(document.getElementById('mdv-config').textContent);`
   and use `cfg.themeKey`, `cfg.scrollKey`, `cfg.lightCss`, `cfg.darkCss`.
3. In `js/script.js`, delete the local `STORAGE_THEME_KEY`,
   `STORAGE_SCROLL_KEY`, `STORAGE_CONTENT_KEY` (move to `cfg.contentKey`),
   `PREVIEW_CSS_LIGHT`, `PREVIEW_CSS_DARK` and replace with the same
   `JSON.parse(document.getElementById('mdv-config').textContent)` read once
   into a local `const CONFIG = ...` at the top of the file.

**Acceptance:** exactly one place defines each of the four constants.
`localStorage` keys and CSS paths continue to work identically. FOUC
behaviour is preserved (the boot script still runs before stylesheet paint).

**Optional alternative** (only if you don't want JSON in HTML): keep the
constants inline in HTML and have `script.js` re-derive them from
`document.documentElement.dataset` attributes set by the boot. Slightly more
clever, less explicit. Stick with the JSON block.

---

### Phase 2 — Dead-code and duplicate-listener removal

**Goal:** small, mechanical cleanups in `js/script.js` and `css/style.css`.

1. Remove `let hasEdited = false;` and the two assignments
   (`script.js:1,287,292`).
2. Merge the two `editor.addEventListener('scroll', ...)` handlers into one
   that does both the highlight-scroll sync and the preview-scroll sync
   (guarded by the `data-sync` attribute / `scrollBarSync` flag).
3. Drop the `headerIds: false, mangle: false` options from `marked.parse`,
   or — if you'd rather keep them as a self-documenting "we want
   non-anchorised headings" intent — add a one-line comment that they're
   no-op in `marked` ≥ 4.
4. Merge the two `body { ... }` rule blocks in `css/style.css:13–27`.

**Acceptance:** no functional diff, fewer lines, no dead references.

---

### Phase 3 — Hardening: wrap `js/script.js` in an IIFE with `'use strict'`

**Goal:** stop leaking top-level `let`/`const` to `window`, without
introducing a build step or changing load order.

**Approach:**

1. Open `js/script.js` with:
   ```js
   (function () {
     'use strict';
     // ... existing code ...
   })();
   ```
2. No further changes are required: the file is loaded as a classic
   `<script src="js/script.js">` at the bottom of `<body>`, and the IIFE
   runs synchronously, so `document.getElementById('editor')` etc. still
   resolve.

**Acceptance:** `window` is clean (verify with `Object.keys(window).filter(k => /^(editor|output|renderer|hasEdited|scrollBarSync|...)/.test(k))` in DevTools — should be empty).

---

### Phase 4 — Centralise the syntax-highlight palette

**Goal:** replace the ~18 dark-mode selectors in `css/style.css:300–326`
with a small set of CSS custom properties.

**Approach:**

1. At the top of `css/style.css`, define a light palette on `:root` and
   override it in `[data-theme="dark"]`:
   ```css
   :root {
     --hl-heading:     #0550ae;
     --hl-em:          #1f2328;
     --hl-strong:      #1f2328;
     --hl-code:        #0550ae;
     --hl-fence:       #656d76;
     --hl-link:        #0550ae;
     --hl-link-url:    #656d76;
     --hl-image:       #0969da;
     --hl-image-url:   #656d76;
     --hl-quote:       #656d76;
     --hl-list-marker: #0550ae;
     --hl-hr:          #d0d7de;
     --hl-strike:      #656d76;
     --hl-table-sep:   #d0d7de;
     --hl-body:        #1f2328;
   }
   [data-theme="dark"] {
     --hl-heading:     #58a6ff;
     --hl-em:          #e6edf3;
     --hl-strong:      #e6edf3;
     --hl-code:        #58a6ff;
     --hl-fence:       #6e7681;
     --hl-link:        #58a6ff;
     --hl-link-url:    #6e7681;
     --hl-image:       #79c0ff;
     --hl-image-url:   #6e7681;
     --hl-quote:       #6e7681;
     --hl-list-marker: #58a6ff;
     --hl-hr:          #30363d;
     --hl-strike:      #6e7681;
     --hl-table-sep:   #30363d;
     --hl-body:        #e6edf3;
   }
   ```
2. Replace each `.hl-*` rule with `color: var(--hl-...);`.

**Acceptance:** syntax-highlight colours are visually identical; the dark
selectors collapse from ~18 lines to one block. Adding a third theme
("solarized", etc.) becomes a 15-line block.

---

### Phase 5 — Docs polish (optional)

**Goal:** give the next reader a 30-second mental model of the project.

1. In `README.md`, add a short **Project layout** section mirroring the
   tree in §1.1, with one-line purposes.
2. Add a **Adding a new theme** note pointing at the JSON config block
   introduced in Phase 1 and the CSS variables introduced in Phase 4.
3. Note the `marked` version pinned by the CDN (`@latest` resolves to
   `marked` 12+; `headerIds`/`mangle` were removed in 4/5) so future
   readers don't re-add the dead options.

---

## 3. Out of scope (deliberately)

These were considered and **not** included because the user asked for a
trivial strategy on a tight codebase:

- Splitting `js/script.js` into ES modules. The file is 554 lines; a module
  split adds tooling (or `<script type="module">` + CORS rules for
  `file://`) for no functional gain at this size.
- Splitting `css/style.css` into partials. The file is 458 lines; still
  under the threshold where partials pay off.
- Replacing the custom regex-based syntax highlighter (`highlightMd`) with
  a CodeMirror/Monaco overlay. That is a feature, not a refactor.
- A linter / formatter. Welcome to add later, but the project is small
  enough that the cost of introducing it exceeds the benefit today.

---

## 4. Suggested execution order

```
Phase 0  →  Phase 1  →  Phase 2  →  Phase 3  →  Phase 4  →  Phase 5
 (hygiene)   (config)    (cleanup)   (harden)   (palette)   (docs)
```

Each phase is a self-contained commit and the app remains runnable
throughout (open `index.html` or `python -m http.server`).
