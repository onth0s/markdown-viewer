# Markdown Viewer — Full Codebase Audit & Refactoring Strategy

## Executive Summary

The codebase is well-structured for a vanilla JS single-page app. It uses native ES modules with a clean directory separation (`common/`, `editor/`, `preview/`, `selection/`), has no build step or bundler, and ships with a thoughtful boot-script-in-HTML FOUC-prevention pattern. The issues are mostly **code hygiene**, **duplication**, **undeclared consistency gaps**, and a handful of **missing guards/edge cases** — nothing architectural.

The phases below are ordered from safest to most impactful. Each phase is self-contained and independently mergeable.

---

## Phase 1 — Code Style & Hygiene Normalization

**Goal**: Eliminate inconsistencies that make the codebase harder to read and review without touching any behaviour.

### 1.1 · Unify `let` vs `const` for exported functions

Every exported value in `js/common/` and `js/editor/` uses `export let fn = () => {}` (a mutable binding), but **nothing ever re-assigns these**. The `SelectionEngine` class in `js/selection/selection-engine.js` correctly uses `export class`. Standalone functions in `js/selection/dom-highlighter.js` use `function` declarations for private helpers and `export let` for public ones — inconsistently.

**Action**: Convert all `export let fn = () => {}` that are never re-assigned to `export const fn = () => {}`. Apply this consistently across **all 24 JS modules**. The `function` declarations used only internally (e.g. `highlightTextRange`, `getTextNodes` in `dom-highlighter.js`) should remain as-is or be converted to `const` — both are correct, pick one style.

#### Affected files
All files in `js/common/`, `js/editor/`, `js/preview/`, `js/selection/` that use `export let`.

---

### 1.2 · Normalize line endings

Source files show a mix of `\r\n` (CRLF) and `\n` (LF). `color-engine.js` and `emoji-helper.js` use LF; the rest use CRLF.

**Action**: Add a [`.editorconfig`](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/.editorconfig) at the project root enforcing `end_of_line = lf` and `charset = utf-8`. Run a one-time pass (`git ls-files | xargs dos2unix` or equivalent) to normalize. Add a `.gitattributes` with `* text=auto eol=lf`.

---

### 1.3 · Tighten ESLint rules

The current [`eslint.config.js`](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/eslint.config.js) has only 3 rules.

**Action**: Add the following rules:
```js
"prefer-const": "error",
"no-var": "error",
"eqeqeq": ["error", "always"],
"no-implicit-globals": "error"
```
This will surface any surviving `let`-that-should-be-`const` automatically.

---

### 1.4 · Add `"name"` to `package.json`

[`package.json`](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/package.json) lacks a `"name"`, `"version"`, and `"description"` field. This causes warnings with some tooling.

**Action**: Add `"name": "markdown-viewer"`, `"version": "1.0.0"`, `"description"`, and `"private": true`.

---

## Phase 2 — Duplication Elimination

**Goal**: Remove the most glaring DRY violations, starting with those that present a real maintenance risk (bugs fixed in one place but not the other).

### 2.1 · Deduplicate scrollbar thumb update logic

`js/editor/scrollbars.js` contains **two copies** of the thumb position/size calculation:
- Inside `updateCustomScrollbar()` (exported, used externally)
- Copied verbatim inside `initCustomScrollbar()` as a local `update()` closure

The internal `update` is never exported but is referenced by the `editor.addEventListener('scroll', update)`. Both compute `thumbH` and `maxTop` with identical math.

**Action**: Rename `updateCustomScrollbar` to `computeScrollbarThumb` (a pure helper), then call it from both the exported function and the internal `update` closure.

---

### 2.2 · Consolidate the proximity-overlay pattern

`js/common/scroll-utils.js` has **three nearly identical functions** — `setupScrollOverlay`, `setupFullscreenOverlay`, and `setupClearallOverlay` — that share the same:
- `PROXIMITY_THRESHOLD = 60` constant
- `show/hide` local functions
- `mousemove`, `mouseleave`, `mouseenter` listener pattern

The only differences are which corner triggers visibility (nearRight+nearTop/Bottom, nearLeft+nearTop, nearLeft+nearBottom).

**Action**: Extract a single `setupProximityOverlay(overlayEl, wrapperEl, triggerFn)` factory, where `triggerFn(mouseX, mouseY, rect)` returns `boolean`. The three existing exports become thin wrappers calling this factory with their respective predicates.

---

### 2.3 · Unify `\r` stripping

The CRLF→LF stripping pattern appears in **three different places** with different implementations:

| Location | Method |
|---|---|
| `markdown-renderer.js` `convert()` | Character-by-character loop |
| `selection-engine.js` `setMarkdown()` | `String.replace(/\r/g, '')` |
| `source-mapper.js` `translateOffset()` | Per-character skip inside a loop |

**Action**: Add a single `stripCR(str)` export to `js/common/utils.js`:
```js
export const stripCR = (str) => str.replace(/\r/g, '');
```
Then replace all three usages. The `convert()` character-by-character loop in `markdown-renderer.js` is especially inefficient and should be the first to go.

---

### 2.4 · Consolidate the `PROXIMITY_THRESHOLD` magic number

`PROXIMITY_THRESHOLD = 60` is defined locally inside each of the three overlay functions in `scroll-utils.js`. It should be a single named constant at the top of the file (this is a prerequisite of Phase 2.2 anyway).

---

## Phase 3 — Logic & Safety Hardening

**Goal**: Address real correctness gaps and missing guards that could cause silent bugs.

### 3.1 · Harden the `COLOR_MAP` synchronization gap

The `COLOR_MAP` data is currently defined in **three separate locations**, kept in sync manually:
1. Boot script in [`index.html`](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/index.html) (lines 18–60) — compact `[S,L, S,L]` array format
2. `js/common/theme-engine.js` — `{ light: [S,L], dark: [S,L] }` object format
3. `css/variables.css` — CSS custom properties (the "ground truth" for defaults)

There is a comment in `constants.js` warning about this, but it's easy to miss. If a single token is added or renamed, all three must be updated.

**Action**: Since the boot script must be inline in `index.html` (it's a FOUC blocker), it cannot be a module. The `variables.css` can't be generated. So the actionable improvement is:
- Add a dedicated comment block in `index.html` adjacent to the `COLOR_MAP` listing its exact format and pointing to `theme-engine.js`
- Add a companion `/* AUTO-SYNC: see theme-engine.js COLOR_MAP */` comment in `variables.css` for each section
- Document the sync requirement in a `CONTRIBUTING.md` or `misc/PLAN.md`

This is not auto-enforcement, but it creates a clear, searchable audit trail.

---

### 3.2 · Guard all `localStorage` access in `color-engine.js` and `theme-engine.js`

`color-engine.js` calls `localStorage.getItem/setItem` directly with no try/catch. `theme-engine.js` does the same in `getBrightness()` and `saveBrightness()`. Contrast this with `storage.js`, where every function is wrapped in try/catch.

**Action**: Wrap `localStorage` access in `color-engine.js` and `theme-engine.js` in try/catch blocks, matching the pattern in `storage.js`. Alternatively, route all `localStorage` access through `storage.js` (add `getHue`/`saveHue`/`getBrightness`/`saveBrightness` storage helpers there).

> [!WARNING]
> The second option (centralize in `storage.js`) is the cleaner long-term solution, but it requires `color-engine.js` and `theme-engine.js` to import from `storage.js` — a new dependency edge. Prefer this if you plan further storage consolidation; otherwise go with try/catch in-place.

---

### 3.3 · Remove the `highlighter.js` re-export of `escapeHtml`

[`js/editor/highlighter.js`](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/js/editor/highlighter.js) line 3 has:
```js
export { escapeHtml };
```
`escapeHtml` is imported from `utils.js` and then immediately re-exported. No module in the codebase imports `escapeHtml` from `highlighter.js` — they all import directly from `utils.js`. This is a dead re-export that creates a misleading secondary export surface.

**Action**: Remove the re-export line.

---

### 3.4 · Fix the stale `lastSelStart/lastSelEnd` guard in `editor-controller.js`

In `initEditorController`, the guard `if (lastSelStart === start && lastSelEnd === end) return;` inside `handleSelectionUpdate()` prevents redundant selection change events. However, the initial values are `-1 / -1`, which means the very first cursor event will always fire even if `start === 0` and `end === 0`. This is fine in practice because the first event *should* fire, but it is semantically misleading.

**Action**: Initialize `lastSelStart = null` and `lastSelEnd = null` instead of `-1`. This makes the intent ("not yet set") explicit.

---

### 3.5 · Guard `previewEl` access in `theme-controller.js`

In `initThemeToggle` and the brightness slider change handler in `settings-panel.js`, `previewEl.scrollHeight`, `previewEl.clientHeight`, and `previewEl.scrollTop` are accessed without null-checking `previewEl`. In `initThemeToggle` line 76, if `previewEl` is null (e.g., during a hypothetical future unit test or a partial DOM), this will throw.

**Action**: Wrap the scroll-ratio preservation logic in a `if (previewEl)` guard.

---

### 3.6 · Declare `'use strict'` (or rely on module context)

All `.js` files are ES modules (`type="module"` in `package.json` and `<script type="module">`), so strict mode is implicit. This is fine and correct. **No action needed** — call this out positively as-is.

---

## Phase 4 — Performance Micro-optimisations

**Goal**: Eliminate unnecessary computation in hot paths without changing any observable behaviour.

### 4.1 · Memoize `getTextNodes` result in `dom-highlighter.js`

`clearHighlights()` calls `container.normalize()` on every selection change, which causes a full text-node merge pass over the entire preview DOM. Then `applyHighlight()` calls `getTextNodes()` recursively on every matched element. These two operations together on large documents can cause jank.

**Action**: In `clearHighlights`, skip `container.normalize()` unless spans were actually removed (only call it when `highlights.length > 0`). This is a two-line change.

---

### 4.2 · Avoid string concatenation in the `cleanMd` loop in `markdown-renderer.js`

`convert()` strips `\r` characters via:
```js
for (let i = 0; i < markdown.length; i++) {
  if (markdown[i] !== '\r') { cleanMd += markdown[i]; }
}
```
This `O(n²)` string concatenation pattern is replaced by Phase 2.3's `stripCR()`, which uses a single regex replace and is O(n).

---

### 4.3 · Cache `getComputedStyle` call in `logo-engine.js`

`updateThemedLogos()` is called frequently (on every hue/brightness input event). It calls `getComputedStyle(document.documentElement)` and reads 5 CSS custom properties on every invocation. While browsers optimize repeated calls, it adds up during slider drag.

**Action**: No change needed — the CSS custom properties must be re-read on every call since they change. However, the 5 reads could be collapsed into a single object lookup or combined into fewer CSS variables if desired. Mark as **optional, low priority**.

---

### 4.4 · Debounce `syncHighlight` on rapid input

`editor-controller.js` calls `syncHighlight()` synchronously on every `input` event. For large documents, the regex highlighting pass in `highlighter.js` can be noticeably slow. Currently the only rate-limiting is the implicit browser event batching.

**Action**: Wrap `syncHighlight` in a `requestAnimationFrame` guard so it renders at most once per frame. Ensure `wrapEmojis(editorHighlight)` is called in the same frame to avoid a visual split.

```js
let highlightRafPending = false;
editor.addEventListener('input', () => {
  if (!highlightRafPending) {
    highlightRafPending = true;
    requestAnimationFrame(() => {
      highlightRafPending = false;
      syncHighlight(editor, editorHighlight);
      wrapEmojis(editorHighlight);
    });
  }
  updateCaretIndicator(...);
  updateCustomScrollbar(...);
  if (onInput) onInput(editor.value);
});
```

> [!NOTE]
> The `onInput` callback (which triggers `convert()` → full markdown re-render) is already debounce-free and runs synchronously on every keystroke. This is intentional for live preview responsiveness. Only the *visual highlight layer* is rate-limited here.

---

## Phase 5 — Structural Improvements

**Goal**: Larger-scope improvements that reduce coupling and improve maintainability. Require more planning and testing.

### 5.1 · Centralize all `localStorage` access in `storage.js`

Currently `storage.js` contains most storage helpers, but `color-engine.js` (`getHue`, `saveHue`) and `theme-engine.js` (`getBrightness`, `saveBrightness`, `BRIGHTNESS_KEY`, `THEME_KEY`) define their own storage logic in isolation. This means `HUE_KEY` and `BRIGHTNESS_KEY` are scattered and not visible from `constants.js`.

**Action**:
1. Move `HUE_KEY` and `BRIGHTNESS_KEY` string constants into `constants.js`
2. Move `getHue`/`saveHue` into `storage.js`; have `color-engine.js` import them
3. Move `getBrightness`/`saveBrightness` into `storage.js`; have `theme-engine.js` import them

This makes `storage.js` the single authoritative source for all persistence, and `constants.js` the single source of truth for all key strings.

> [!IMPORTANT]
> This is Phase 5 because it introduces new import edges and can cause circular dependency issues if not carefully planned. `storage.js` → `constants.js` (already exists). `color-engine.js` → `storage.js` (new). `theme-engine.js` → `storage.js` (new). No cycles would be introduced.

---

### 5.2 · Extract the PDF export `onclone` logic into a named function

`actions.js` `exportPreviewToPdf()` has a 60-line inline `onclone` callback inside the `options` object. This is the longest and most complex inline function in the codebase and makes the surrounding `async` flow hard to follow.

**Action**: Extract the `onclone` body into a named function `preparePdfClone(clonedDoc)` at the module level. The options object becomes:
```js
html2canvas: { scale: 2, useCORS: true, onclone: preparePdfClone }
```

---

### 5.3 · Split `scroll-utils.js` — move fullscreen/clearall into their own module

`scroll-utils.js` currently exports 5 functions: `setupScrollOverlay`, `setupFullscreenOverlay`, `setupClearallOverlay`, `initFullscreenButton`, and `initClearallButton`. The first is a shared utility; the last four are editor/preview-pane-specific interactions.

**Action**: Move `setupFullscreenOverlay`, `setupClearallOverlay`, `initFullscreenButton`, and `initClearallButton` into a new file `js/common/overlay-actions.js`. Update `main.js` imports accordingly.

---

### 5.4 · Remove module-level mutable state from `ui-divider.js`

`ui-divider.js` exposes two module-level mutable variables at the top of the file:
```js
let lastLeftRatio = 0.5;
let applyRatioFn = null;
```
Both are used by `initSwapButton()`, which needs access to state set by `setupDivider()`. This is an implicit coupling through module-level globals.

**Action**: `setupDivider()` should return an object `{ applyRatio }` that `initSwapButton` can receive as a parameter. Update `main.js` to:
```js
const divider = setupDivider();
initSwapButton(divider);
```
This eliminates the module-level mutable state and makes the data flow explicit.

---

## Verification Plan

Each phase should be verified before moving on to the next.

### After Each Phase
- Run `npx eslint js/` to confirm zero new ESLint errors
- Visually confirm: editor typing, theme toggle, brightness slider, hue slider, scroll sync, divider drag, PDF export, drag-and-drop file loading, pane swap

### Automated Tests (Future)
The codebase currently has no test suite. Phases 2–5 would benefit from unit tests for:
- `highlightMd()` in `highlighter.js`
- `enrichTokensWithPositions()` in `source-mapper.js`
- `translateOffset()` in `source-mapper.js`
- `applyHighlight()` / `clearHighlights()` in `dom-highlighter.js`
- `interpolateColor()` in `theme-engine.js`

Adding a minimal test harness (e.g. Vitest with jsdom) after Phase 3 is a natural checkpoint before the structural changes in Phase 5.
