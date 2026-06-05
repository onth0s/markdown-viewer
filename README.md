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
│   ├── app.css           # App structure layouts
│   ├── variables.css     # Global HSL dynamic CSS tokens
│   ├── preview.css       # Markdown output styling rules
│   └── scrollbars.css    # Custom scrollbar styles
├── js/
│   ├── main.js           # Core bootstrapper & orchestrator (bootstrap steps 1-10)
│   ├── common/           # Shared state & utility engines
│   │   ├── utils.js             # General pure helpers (e.g. escapeHtml)
│   │   ├── constants.js         # Core constant configurations
│   │   ├── storage.js           # Persistent settings store
│   │   ├── theme-controller.js  # Theme/Style applicator
│   │   ├── theme-engine.js      # Raw theme math calculations
│   │   ├── color-engine.js      # Color conversion calculations
│   │   ├── logo-engine.js       # Dynamic SVG path coloring
│   │   ├── scroll-sync.js       # Horizontal & vertical sync engines
│   │   ├── scroll-utils.js      # UI element scrolling actions
│   │   ├── settings-panel.js    # Settings & customizer panel
│   │   └── ui-divider.js        # Split-pane divider resizer
│   ├── editor/           # Editor interactions
│   │   ├── editor-controller.js # Monaco/Textarea interaction handlers
│   │   ├── highlighter.js       # Input text highlighting
│   │   └── scrollbars.js        # Editor custom scrollbar styling
│   ├── preview/          # Preview rendering & UI actions
│   │   ├── markdown-renderer.js # Markdown rendering engine
│   │   ├── mermaid-renderer.js  # Mermaid parser & container initiator
│   │   ├── actions.js           # Copy, download, clear-all action handlers
│   │   ├── hscrollbar.js        # Custom preview horizontal scrollbar
│   │   └── scrollbars.js        # Preview scroll sync handlers
│   └── selection/        # Editor-to-preview selection binding
│       ├── selection-engine.js  # Editor selection orchestrator
│       ├── source-mapper.js     # Text-to-HTML source mapper
│       └── dom-highlighter.js   # Element spotlight rendering
└── DEFAULT.md            # Default template loaded on first application run
```

---

## Installation & Running

Since this project leverages ES modules directly in the browser, no compilation, transpiling, or build step is necessary.

### 1. Serve Locally
Simply start any standard web server in the project directory.

Using Node.js (`http-server` or `npx`):
```bash
npx http-server .
```

Using Python:
```bash
python -m http-server 8000
```

### 2. View in Browser
Open the localhost address provided by your local server (e.g. `http://localhost:8080`) to load the application.
