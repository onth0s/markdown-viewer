# Plan: Sync Editor Selection to Preview Panel

## Status
- Phase 1 (block-level) ✅ — complete
- Phase 2 (inline precision) ✅ — complete
- Phase 2b (code blocks & tables) ❌ — not started

## Goal
When text is selected in the editor (`selectionStart !== selectionEnd`), highlight the corresponding rendered content in the preview panel. When the selection is collapsed (caret only), remove the highlight.

## Architecture

Use **marked's `lexer` + `parser` API** to walk the token tree with cumulative character-offset tracking, then re-render with a custom renderer that injects `<span class="preview-selection">` around overlapping tokens. Phase 2 extends this by walking inline tokens within partially-overlapping blocks for character-level precision.

**Key insight**: `marked.parse()` is already called on every keystroke via `convert()`. Selection-highlight re-renders are additive — only triggered when selection changes without typing.

## Strategy

Two levels of precision:

### Phase 1 — Block-level highlighting (initial)
- Walk **block-level** tokens only (paragraph, heading, list, blockquote, code, etc.)
- Track cumulative `token.raw.length` to determine which blocks overlap `[selectionStart, selectionEnd)`
- Fully highlight any block that overlaps the selection
- **Trade-off**: selecting a few words in a paragraph highlights the entire paragraph. Simple, fast, always correct.

### Phase 2 — Inline precision (refinement)
- Within partially-overlapping blocks, walk their **inline** token tree (text, strong, em, codespan, link, etc.)
- Track offsets within the block's raw text (accounting for syntax in container tokens)
- For **container** inline tokens (strong, em, link, del): if any part overlaps, highlight the entire rendered content
- For **leaf** inline tokens (text): if partially overlapping, split at the boundary and only wrap the selected portion
- **Trade-off**: more complex but gives character-level accuracy

### Phase 2b — Extra precision for code blocks & tables
- For fenced/indented code blocks: match line ranges instead of character ranges (simpler, no inner HTML to mess with)
- For tables: treat each cell as a leaf and highlight full cells

## Implementation Plan

### Step 1 — New function: `renderWithSelection(md, selStart, selEnd)`

```js
function renderWithSelection(md, selStart, selEnd) {
  let tokens = marked.lexer(md);
  markSelection(tokens, selStart, selEnd);  // Phase 1
  let selRenderer = buildSelectionRenderer(); // extends existing renderer
  return marked.parser(tokens, { renderer: selRenderer });
}
```

### Step 2 — Block walk with Phase 2 inline precision

Walk block tokens with cumulative offset tracking. For partially-overlapping blocks, dispatch to inline-level token walking via `markPartial()`:

1. **Full coverage**: `tokenStart >= selStart && contentEnd <= selEnd` → `token._sel = true` (block-level `<div>` wrap)
2. **Partial coverage**: calls `markPartial(token, localStart, localEnd)` which:
   - **Has inline children** (paragraph, heading, list_item): compute `contentOffset` (structural prefix like `## ` or `- `), adjust selection bounds into inline content space, then call `walkInlineTokens()`
   - **List** (has `items`): walk each item with cumulative raw-length offset, recurse into item via `markPartial()`
   - **Block children** (blockquote): walk each child with cumulative raw-length offset, recurse via `markPartial()`
   - **Fallback**: `token._sel = true` (whole block for code blocks, hr, etc.)

`contentOffsetInRaw()`: Computes the number of raw characters before inline content starts. Formula: `raw.length - 1 - sum(childRaws)`. Works for paragraphs (0), headings of any depth (`## ` → 3), and list items (`- ` → 2).

### Step 3 — `walkInlineTokens()` — inline-level token walk

Recursive function that walks inline tokens with cumulative `raw.length` offset tracking:

```
offset = 0
for each inline token:
  if overlapping [localStart, localEnd):
    if text leaf (no child tokens):
      if fully covered → _sel = true
      if partially covered → _sel = { splitStart, splitEnd }
    else (container: strong, em, text with children, etc.):
      token._sel = true
      if partially covered: recurse into children
        (childBase = token.raw.indexOf(firstChild.raw))
```

Key details:
- **Container children offset**: computed via `parentRaw.indexOf(childRaw)` which finds where child content starts within the parent's raw (e.g., `**world**`.indexOf(`world`) = 2)
- **Full coverage skip**: when a container is fully covered, children are NOT recursed into (avoids double `<span>` wrapping)
- **Text splitting**: for partially-covered leaf text tokens, `{ splitStart, splitEnd }` stores the character offsets within the text content

### Step 4 — Selection-aware renderer

Creates a custom renderer (`Object.create(renderer)`) that overrides methods to inject selection wrappers:

- **blockWrapper**: wraps output in `<div class="preview-selection">` when `token._sel === true` (strict equality to distinguish from split object). Only full-block coverage triggers this.
- **textWrapper**: handles text tokens specially:
  - If `_sel` is object → split `html` at `splitStart/splitEnd`, wrap middle portion in `<span class="preview-selection">`
  - If `_sel` is true → wrap entire output in `<span class="preview-selection">`
- **inlineWrapper**: wraps output in `<span class="preview-selection">` when `_sel` is truthy (used for strong, em, codespan, del, link, image, br, checkbox)

Renderer method wrapping:
- Block methods → `blockWrapper`: space, code, blockquote, html, def, heading, hr, list, listitem, paragraph, table, tablerow, tablecell
- Inline methods → `inlineWrapper`: strong, em, codespan, br, del, link, image, checkbox
- Text → `textWrapper` (custom splitting logic)

### Step 5 — Modify `convert()` to handle selection

```js
let convert = (markdown, selStart, selEnd) => {
  let html = renderWithSelection(markdown, selStart, selEnd);
  ...
};
```

`renderWithSelection` handles the `selStart == null || selEnd == null || selStart === selEnd` case internally by falling back to `marked.parse()`.

### Step 6 — CSS

```css
.preview-selection {
  background-color: var(--selection-bg);
  border-radius: 2px;
}
```

### Step 7 — Performance guardrails

- **Throttle during drag**: wrap the `mousemove` handler in `requestAnimationFrame` (same pattern as `updateCaretIndicator`)
- **No re-render on input**: the `input` handler already calls `convert()` — keep using normal `marked.parse()` there. Only selection-only changes trigger the expensive path
- **No `walkTokens` overhead**: use our own walk, not `marked.walkTokens()`, to avoid the async overhead and to control the traversal order

### Step 8 — Queue: `queueMicrotask` for keydown auto-repeat

The `keydown` handler uses `queueMicrotask(updatePreviewSelection)` instead of `setTimeout(0, ...)`. During OS auto-repeat (Shift+Arrow held), microtasks are flushed between macrotasks, so each auto-repeat keydown's selection is captured before the next one fires.

Also removed unused `selPreviewPending` flag.

## Open Questions

1. ~~DOMPurify + `<span class="preview-selection">`~~ → Verified: DOMPurify default config allows `span` and `div` with `class` attributes. No `ADD_TAGS`/`ADD_ATTR` needed.
2. ~~Mermaid + selection~~ → Verified: `blockWrapper` on `code` renderer skips if `_sel` is not `=== true`, and mermaid blocks are only partially covered (since the fenced code block `raw` includes backticks). The custom `renderer.code()` returns `<pre class="mermaid">` which is wrapped in `<div class="preview-selection">` when the entire block is selected. SVG inside is not sub-highlighted.
3. **Code blocks** — fenced/indented code blocks fall back to block-level highlighting (whole block). Phase 2b would add line-range matching.
4. **Table cells** — Phase 2 does NOT walk table cell inline tokens; table cells fall back to block-level rendering. Phase 2b would add this.

## Files modified

| File | Changes |
|---|---|
| `js/script.js` | Added `inlineTokenTypes`, `hasInlineChildren`, `contentOffsetInRaw`, `walkInlineTokens`, `markPartial`, `renderWithSelection`; modified `convert()`; wired selection listeners; `queueMicrotask` in keydown |
| `css/style.css` | Added `.preview-selection` CSS class (light + dark variants) |
| `misc/PLAN.md` | This file — updated as we go |

## Out of scope (for now)

- **Copy/paste from preview**: not requested
- **Click on preview to select in editor**: not requested
- **Scroll-to-selection in preview**: not requested
- **Table cell inline precision** (Phase 2b): table cells fall back to block-level
- **Code block line-range matching** (Phase 2b): code blocks highlight entirely
