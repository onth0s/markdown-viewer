# Markdown Viewer Refactoring Strategy & Code Audit

This document outlines the findings of a codebase audit for the Markdown Viewer application, followed by a sequential, step-by-step plan to refactor, modernize, and secure the repository.

---

## 🔍 Code Audit Findings

### 1. Scope & Reference Bug in `js/common/ui-divider.js`
* **Issue:** Inside [ui-divider.js](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/js/common/ui-divider.js), the function `initSwapButton()` tries to invoke `applyRatio(lastLeftRatio)` when the swap button is clicked. However, both `applyRatio` and `lastLeftRatio` are defined locally inside the body of `setupDivider()`.
* **Impact:** Clicking the swap button results in a runtime `ReferenceError: applyRatio is not defined`, breaking the reflow function of the layout.
* **Remedy:** Move these variables to a shared module scope or export them appropriately so both functions can access them.

### 2. Configuration Duplication (`COLOR_MAP` and Interpolation)
* **Issue:** To prevent Flash of Unstyled Content (FOUC), [index.html](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/index.html) runs a synchronous inline `<script>` containing a full copy of the `COLOR_MAP` and theme HSL interpolation algorithms. This exact configuration and math are duplicated inside [theme-engine.js](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/js/common/theme-engine.js).
* **Impact:** Changes to themes, color palettes, or interpolation math must be manually synchronized in two separate locations.
* **Remedy:** While FOUC-prevention scripts must remain inline in the HTML to run immediately, we should clearly link them, use data attributes, or generate the inline script at build time if a builder is introduced. At minimum, inline variables can be attached to a global config namespace (`window.__THEME_CONFIG__`) to be read directly by `theme-engine.js`.

### 3. Vulnerability to CDN Failures & Lacks SRI
* **Issue:** Third-party scripts (marked, DOMPurify, Prism) and styles are loaded from external CDNs (cdnjs, jsdelivr) without Subresource Integrity (SRI) `integrity` hashes.
* **Impact:** If the CDN is compromised, malicious code could be injected into the application. If the CDN goes down, the application will fail to render markdown.
* **Remedy:** Add `integrity` hashes and consider local fallbacks for production builds.

### 4. Fragmented Stylesheets
* **Issue:** The CSS is split into 10 separate files loaded individually in the document `<head>`.
* **Impact:** Multiple network requests are made for stylesheet chunks, which slows down initial rendering (especially on slow networks).
* **Remedy:** Use a simple bundler (e.g., Vite/esbuild) or combine non-dynamic styles using CSS imports (`@import`) to clean up `index.html`.

---

## 🗺️ Sequential Refactoring Strategy

### Phase 1: Critical Bug Fixes
Resolve the runtime reference errors to restore full layout swapping features.

1. **Refactor [ui-divider.js](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/js/common/ui-divider.js):**
   * Move the state variables (`lastLeftRatio`, `applyRatio`) to file/module scope rather than local function scope.
   * Ensure `initSwapButton()` has full access to the layout reflow functions.
2. **Verification:**
   * Test dragging the divider to resize panes.
   * Test clicking the Swap Pane button to verify the panes swap places without raising console errors.

### Phase 2: Theme Config & Interpolation Unification
Reduce duplicate HSL interpolation logic.

1. **Leverage HTML Init Values:**
   * Modify the inline script in [index.html](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/index.html) to write its final computed variables and maps to a global config namespace (e.g., `window.__INITIAL_THEME__`).
   * Update [theme-engine.js](file:///c:/Users/Leonardo/001/00__DEV/markdown-viewer/js/common/theme-engine.js) to read configuration parameters from this namespace if present, avoiding code/mapping drift.
2. **Add Code Synchronization Comments:**
   * Place explicit warnings in both files to ensure future theme additions update both files.

### Phase 3: CDN Safety & Quality Audit
Secure and immunize external dependencies.

1. **Subresource Integrity (SRI):**
   * Add `integrity` attributes and `crossorigin="anonymous"` to CDN script and link tags:
     * DOMPurify
     * Marked
     * Prism Core & Autoloader
     * Mermaid
2. **Local Fallback:**
   * Provide local copies or graceful handling if a script fails to load.

### Phase 4: Tooling & Test Automation
Establish static code analysis, formatting standards, and tests.

1. **Linters and Formatters:**
   * Initialize `eslint` and `prettier` config files.
   * Run format check on all source files.
2. **Automated Testing:**
   * Setup a lightweight unit/integration testing suite using **Vitest** or **Playwright** to test markdown conversion logic, layout resizing, and theme states.
