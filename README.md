# Markdown Viewer

A premium, client-side Markdown Editor and Live Previewer built with vanilla modern HTML, CSS, and modular ES6 JavaScript.

Featuring deep real-time rendering synchronization, a flexible interactive theme/color customizer (hue/brightness sliders), syntax highlighting, and Mermaid diagram support.

---

## Features

- 📑 **Real-time Live Preview**: Immediate rendering of Markdown as you type.
- 🔄 **Bidirectional Scroll Sync**: Flawless, performance-optimized vertical and horizontal scroll synchronisation between the editor and preview panes.
- 🎨 **Adaptive HSL Theme System**: Dynamic real-time theme adjustment using HUE and Brightness sliders, shifting beautifully from deep dark mode styles to clean, paper-light environments.
- 🧜 **Mermaid.js Diagram Rendering**: Native support for flowchart, sequence, and gantt diagrams inline with your markdown.
- 🔍 **Selection Tracking & Highlighting**: Synchronized element selection highlights matching locations between editor positions and output structures.
- 💻 **Syntax Highlighting**: Pre-bundled with Prism.js for rich syntax coloring inside markdown code fences.
- 🛠️ **Utility Toolbar**: Easily clear, copy, download, or export your documents to PDF.
- 📐 **Split Pane Resizer**: Drag the divider to customize your workspace layout dynamically.

---

## Directory Architecture

Following a comprehensive refactoring, the codebase is strictly modularized:

```
markdown-viewer/
├── index.html            # Main entry point (incorporates FOUC prevention & boots JS)
├── css/                  # Structured styling rules
│   ├── style.css         # Primary stylesheet (layout, presets, variables and core rules)
│   ├── scrollbars.css    # Custom scrollbar tracking & thumb styling rules
│   ├── github-markdown-light.css       # Light theme layout styling for preview Markdown
│   ├── github-markdown-dark_dimmed.css # Dark theme layout styling for preview Markdown
│   ├── variables.css     # Global HSL dynamic CSS tokens (ground truth configuration)
│   ├── reset.css         # Clean browser reset styles
│   ├── layout.css        # Layout grid definitions
│   ├── editor.css        # Textarea editor panel specific layout/visuals
│   ├── header.css        # Navigation header, settings panel & utility actions
│   └── preview.css       # Markdown output area constraints & spacing rules
├── js/
│   ├── main.js           # Core bootstrapper & orchestrator (bootstrap steps 1-11)
│   ├── common/           # Shared state & utility engines
│   │   ├── utils.js             # General pure helpers (e.g. escapeHtml)
│   │   ├── constants.js         # Core configuration storage keys & CDN references
│   │   ├── storage.js           # Persistent state storage & restoration logic
│   │   ├── theme-controller.js  # theme toggler & UI application link
│   │   ├── theme-engine.js      # Raw theme math calculations (interpolation)
│   │   ├── color-engine.js      # HSL color conversion math calculations
│   │   ├── logo-engine.js       # Dynamic SVG path coloring helper
│   │   ├── emoji-helper.js      # Span wrappers for native OS emoji alignments
│   │   ├── drop-loader.js       # File drop handler to load markdown documents
│   │   ├── overlay-actions.js   # Buttons in proximity overlays (clear all / fullscreen)
│   │   ├── scroll-sync.js       # Horizontal & vertical sync engines
│   │   ├── scroll-utils.js      # Proximity popup anchors & helper scroll action controllers
│   │   ├── settings-panel.js    # Accent color hue & brightness slider panel events
│   │   └── ui-divider.js        # Split-pane divider click-and-drag resizer
│   ├── editor/           # Editor interactions
│   │   ├── editor-controller.js # Monaco/Textarea interaction handlers
│   │   ├── highlighter.js       # Input text highlighting using syntax tags
│   │   └── scrollbars.js        # Editor custom scrollbar styling
│   ├── preview/          # Preview rendering & UI actions
│   │   ├── markdown-renderer.js # Markdown rendering engine (using marked & DOMPurify)
│   │   ├── mermaid-renderer.js  # Mermaid parser & canvas initializer
│   │   ├── actions.js           # Copy, download, and export-to-PDF click handlers
│   │   ├── hscrollbar.js        # Custom preview horizontal scrollbar UI logic
│   │   └── scrollbars.js        # Preview scroll custom tracks & scroll events
│   └── selection/        # Editor-to-preview selection binding
│       ├── selection-engine.js  # Editor cursor position & text mapping orchestrator
│       ├── source-mapper.js     # Text-to-HTML source tracking mapping engine
│       └── dom-highlighter.js   # Preview element spotlight/highlight rendering
├── serve.ps1             # Helper script to boot the web server locally (defaults to port 5001)
└── DEFAULT.md            # Default template loaded on first application run
```

---

## Installation & Running

Since this project leverages ES modules directly in the browser, no compilation, transpiling, or build step is necessary.

### 1. Serve Locally
Simply start any standard web server in the project directory.

Using the helper script (Windows PowerShell):
```powershell
./serve.ps1
# Or override default port:
./serve.ps1 8080
```

Using Node.js (`http-server` or `npx`):
```bash
npx http-server -p 5001 .
```

Using Python:
```bash
python -m http-server 5001
```

### 2. View in Browser
Open the localhost address provided by your local server (e.g. `http://localhost:5001`) to load the application.
